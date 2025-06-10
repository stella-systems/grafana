import { z } from 'zod';

import { FieldConfigSource, getDataSourceRef } from '@grafana/data';
import { tool } from '@grafana/llm';
import { getDataSourceSrv } from '@grafana/runtime';
import {
  DeepPartial,
  SceneDataTransformer,
  SceneObject,
  SceneQueryRunner,
  VizPanel,
  VizPanelMenu,
  VizPanelState,
} from '@grafana/scenes';

import { DashboardDatasourceBehaviour } from '../scene/DashboardDatasourceBehaviour';
import { DashboardScene } from '../scene/DashboardScene';
import { VizPanelLinks, VizPanelLinksMenu } from '../scene/PanelLinks';
import { panelLinksBehavior, panelMenuBehavior } from '../scene/PanelMenuBehavior';
import { PanelNotices } from '../scene/PanelNotices';
import { PanelTimeRange } from '../scene/PanelTimeRange';
import { setDashboardPanelContext } from '../scene/setDashboardPanelContext';
import { getVizPanelKeyForPanelId } from '../utils/utils';

// Schema definitions with comprehensive descriptions
const datasourceSchema = z.object({
  type: z.string().describe('The type of datasource (e.g., "prometheus", "loki", "mysql")'),
  uid: z.string().describe('The unique identifier of the datasource instance'),
});

const targetSchema = z.object({
  refId: z.string().default('A').describe('The reference ID for the query, typically "A", "B", etc.'),
  datasource: datasourceSchema.describe('The datasource configuration'),
  hide: z.boolean().optional().default(false).describe('Whether to hide this query'),
  expr: z.string().describe('The query expression to use'),
  range: z.boolean().optional().default(true).describe('Whether this is a range query'),
  legendFormat: z.string().optional().describe('The format for the legend, e.g. "{{state}}"'),
});

const fieldConfigSchema = z.object({
  defaults: z.record(z.unknown()).describe('Default field configuration applied to all fields'),
  overrides: z.array(z.unknown()).describe('Field-specific configuration overrides'),
});

const gridPosSchema = z.object({
  h: z.number().min(1).max(24).default(8).describe('Panel height in grid units (1-24)'),
  w: z.number().min(1).max(24).default(12).describe('Panel width in grid units (1-24)'),
  x: z.number().min(0).max(23).default(0).describe('Panel horizontal position (0-23)'),
  y: z.number().min(0).default(0).describe('Panel vertical position (0+)'),
});

const transformationSchema = z.object({
  id: z.string().describe('The transformation type identifier'),
  options: z.record(z.unknown()).optional().describe('Transformation-specific configuration options'),
});

const panelMetadataSchema = z.object({
  title: z.string().optional().describe('The panel title displayed at the top'),
  description: z.string().optional().describe('Detailed panel description for documentation'),
});

const panelConfigSchema = panelMetadataSchema.extend({
  pluginId: z.string().describe('Panel plugin identifier (e.g., "timeseries", "gauge", "stat", "barchart")'),
  datasource: datasourceSchema
    .optional()
    .describe("The datasource configuration for the panel. If not provided, will use the first target's datasource."),
  options: z.record(z.unknown()).optional().describe('Panel-specific visualization options and settings'),
  fieldConfig: fieldConfigSchema.optional().describe('Field configuration for styling and behavior'),
  targets: z
    .array(targetSchema)
    .min(1)
    .max(5)
    .optional()
    .describe(
      'Query targets for the panel. At least one target is required for panels with data queries. Multiple targets are rare but useful for combining different metrics.'
    ),
  gridPos: gridPosSchema.optional().describe('Panel positioning and sizing on the dashboard grid'),
  transformations: z.array(transformationSchema).optional().describe('Data transformations to apply to query results'),
  timeFrom: z.string().optional().describe('Time range override - relative time (e.g., "1h", "24h")'),
  timeShift: z.string().optional().describe('Time shift override - shift time back (e.g., "1h", "1d")'),
  hideTimeOverride: z.boolean().optional().describe('Whether to hide the time override indicator'),
  transparent: z.boolean().optional().describe('Whether the panel background should be transparent'),
  maxPerRow: z.number().optional().describe('Maximum number of repeated panels per row (for repeated panels)'),
});

const addPanelsSchema = z.object({
  panels: z
    .array(panelConfigSchema)
    .min(1)
    .max(5)
    .describe(
      'Panel configurations to add to the dashboard. Maximum 5 panels at once. Adding multiple panels at once is more efficient than adding one by one.'
    ),
});

export type PanelConfig = z.infer<typeof panelConfigSchema>;
export type AddPanelsConfig = z.infer<typeof addPanelsSchema>;

/**
 * Internal function to create a VizPanel from configuration
 */
function createVizPanelFromConfig(config: PanelConfig, panelId: number): VizPanel {
  const titleItems: SceneObject[] = [];

  // Add panel links
  titleItems.push(
    new VizPanelLinks({
      menu: new VizPanelLinksMenu({ $behaviors: [panelLinksBehavior] }),
    })
  );

  // Add panel notices
  titleItems.push(new PanelNotices());

  // Create data provider if targets exist
  let dataProvider;
  if (config.targets && config.targets.length > 0) {
    const queries = config.targets.map((target) => ({
      refId: target.refId,
      expr: target.expr,
      legendFormat: target.legendFormat,
      hide: target.hide,
      range: target.range,
      datasource: target.datasource,
    }));

    // Use the first target's datasource or the panel datasource
    const datasource = config.datasource || config.targets[0]?.datasource;
    const dsRef = getDataSourceRef(getDataSourceSrv().getInstanceSettings(datasource.uid)!);

    dataProvider = new SceneDataTransformer({
      $data: new SceneQueryRunner({
        queries,
        datasource: dsRef,
        $behaviors: [new DashboardDatasourceBehaviour({})],
      }),
      transformations:
        config.transformations?.map((t) => ({
          id: t.id,
          options: t.options || {},
        })) || [],
    });
  }

  const vizPanelState: VizPanelState<unknown, unknown> = {
    key: getVizPanelKeyForPanelId(panelId),
    title: config.title || 'New Panel',
    description: config.description,
    pluginId: config.pluginId,
    options: config.options || {},
    fieldConfig: (config.fieldConfig as FieldConfigSource<DeepPartial<unknown>>) ?? { defaults: {}, overrides: [] },
    displayMode: config.transparent ? 'transparent' : undefined,
    hoverHeader: !config.title,
    hoverHeaderOffset: 0,
    titleItems,
    $behaviors: [],
    extendPanelContext: setDashboardPanelContext,
    menu: new VizPanelMenu({
      $behaviors: [panelMenuBehavior],
    }),
  };

  // Add data provider if it exists
  if (dataProvider) {
    vizPanelState.$data = dataProvider;
  }

  // Add time range override if specified
  if (config.timeFrom || config.timeShift) {
    vizPanelState.$timeRange = new PanelTimeRange({
      timeFrom: config.timeFrom,
      timeShift: config.timeShift,
      hideTimeOverride: config.hideTimeOverride,
    });
  }

  return new VizPanel(vizPanelState);
}

/**
 * Internal function to add panels to a dashboard
 */
export function addPanelsToDashboard(
  dashboard: DashboardScene,
  config: AddPanelsConfig
): { success: boolean; panelIds: number[]; message: string } {
  try {
    // Validate the configuration
    const validatedConfig = addPanelsSchema.parse(config);

    // Ensure dashboard is in edit mode
    if (!dashboard.state.isEditing) {
      dashboard.onEnterEditMode();
    }

    const panelIds: number[] = [];
    const results: string[] = [];

    // Add each panel
    for (const panelConfig of validatedConfig.panels) {
      // Generate a unique panel ID
      const panelId = Math.floor(Math.random() * 1000000);
      panelIds.push(panelId);

      // Create the VizPanel
      const vizPanel = createVizPanelFromConfig(panelConfig, panelId);

      // Add the panel to the dashboard
      dashboard.addPanel(vizPanel);

      results.push(`Added panel "${panelConfig.title || 'New Panel'}" with ID ${panelId}`);
    }

    // Force re-render to show the new panels
    dashboard.forceRender();

    return {
      success: true,
      panelIds,
      message: results.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      panelIds: [],
      message: `Failed to add panels: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Convenience function to add a single panel
 */
export function addSinglePanelToDashboard(
  dashboard: DashboardScene,
  config: PanelConfig
): { success: boolean; panelId?: number; message: string } {
  const result = addPanelsToDashboard(dashboard, { panels: [config] });

  return {
    success: result.success,
    panelId: result.panelIds[0],
    message: result.message,
  };
}

/**
 * Helper function to get the current dashboard scene
 */
export function getCurrentDashboardScene(): DashboardScene | null {
  const sceneContext = window.__grafanaSceneContext;

  if (sceneContext instanceof DashboardScene) {
    return sceneContext;
  }

  return null;
}

/**
 * Public API function that matches your external tool's interface
 */
export function addDashboardPanels(config: AddPanelsConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const dashboard = getCurrentDashboardScene();

    if (!dashboard) {
      reject(new Error('No dashboard scene context found. This usually means the dashboard is not loaded.'));
      return;
    }

    const result = addPanelsToDashboard(dashboard, config);

    if (result.success) {
      resolve(result.message);
    } else {
      reject(new Error(result.message));
    }
  });
}

const addDashboardPanelsTool = tool.createTool({
  name: 'add_dashboard_panels',
  description: 'Add panels to the dashboard',
  schema: addPanelsSchema,
  func: addDashboardPanels,
});

export function registerAddDashboardPanelsTool() {
  setTimeout(() => {
    tool.registerTool(addDashboardPanelsTool, 'test-plugin', {
      category: 'utilities',
      tags: ['dashboard', 'panels'],
    });
    tool.debugToolRegistry();
  }, 5000);
}
