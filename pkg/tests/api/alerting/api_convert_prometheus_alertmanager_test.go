package alerting

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/tests/testinfra"
)

const testAlertmanagerConfigYAML = `
global:
  smtp_smarthost: localhost:587
  smtp_from: alertmanager@example.org

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: web.hook

receivers:
- name: web.hook
  webhook_configs:
  - url: 'http://127.0.0.1:5001/'

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'dev', 'instance']
`

func TestIntegrationConvertPrometheusAlertmanagerEndpoints(t *testing.T) {
	testinfra.SQLiteIntegrationTest(t)

	// Setup Grafana with alerting import feature flag enabled
	dir, gpath := testinfra.CreateGrafDir(t, testinfra.GrafanaOpts{
		DisableLegacyAlerting: true,
		EnableUnifiedAlerting: true,
		DisableAnonymous:      true,
		AppModeProduction:     true,
		EnableFeatureToggles: []string{
			"alertingImportAlertmanagerAPI",
		},
	})

	grafanaListedAddr, _ := testinfra.StartGrafanaEnv(t, dir, gpath)

	apiClient := newAlertingApiClient(grafanaListedAddr, "admin", "admin")

	t.Run("create and get alertmanager configuration", func(t *testing.T) {
		identifier := "test-alertmanager-config"
		mergeMatchers := "environment=production,team=backend"

		headers := map[string]string{
			"Content-Type":                         "application/yaml",
			"X-Grafana-Alerting-Config-Identifier": identifier,
			"X-Grafana-Alerting-Merge-Matchers":    mergeMatchers,
		}

		amConfig := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: testAlertmanagerConfigYAML,
			TemplateFiles: map[string]string{
				"test.tmpl": `{{ define "test.template" }}Test template{{ end }}`,
			},
		}

		response := apiClient.ConvertPrometheusPostAlertmanagerConfig(t, amConfig, headers)
		require.Equal(t, "success", response.Status)

		getHeaders := map[string]string{
			"X-Grafana-Alerting-Config-Identifier": identifier,
		}
		retrievedConfig := apiClient.ConvertPrometheusGetAlertmanagerConfig(t, getHeaders)
		require.NotEmpty(t, retrievedConfig.AlertmanagerConfig)
		require.Contains(t, retrievedConfig.TemplateFiles, "test.tmpl")
		require.Equal(t, `{{ define "test.template" }}Test template{{ end }}`, retrievedConfig.TemplateFiles["test.tmpl"])

		// Verify the configuration contains expected content
		require.Contains(t, retrievedConfig.AlertmanagerConfig, "smtp_smarthost: localhost:587")
		require.Contains(t, retrievedConfig.AlertmanagerConfig, "web.hook")
	})

	t.Run("delete alertmanager configuration", func(t *testing.T) {
		identifier := "test-alertmanager-config"
		mergeMatchers := "environment=production,team=backend"

		headers := map[string]string{
			"Content-Type":                         "application/yaml",
			"X-Grafana-Alerting-Config-Identifier": identifier,
			"X-Grafana-Alerting-Merge-Matchers":    mergeMatchers,
		}

		amConfig := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: testAlertmanagerConfigYAML,
			TemplateFiles: map[string]string{
				"test.tmpl": `{{ define "test.template" }}Test template{{ end }}`,
			},
		}

		response := apiClient.ConvertPrometheusPostAlertmanagerConfig(t, amConfig, headers)
		require.Equal(t, "success", response.Status)

		deleteHeaders := map[string]string{
			"X-Grafana-Alerting-Config-Identifier": identifier,
		}
		apiClient.ConvertPrometheusDeleteAlertmanagerConfig(t, deleteHeaders)

		// Verify configuration is deleted by trying to get it again
		getHeaders := map[string]string{
			"X-Grafana-Alerting-Config-Identifier": identifier,
		}
		emptyConfig := apiClient.ConvertPrometheusGetAlertmanagerConfig(t, getHeaders)
		require.Empty(t, emptyConfig.AlertmanagerConfig)
		require.Empty(t, emptyConfig.TemplateFiles)
	})

	t.Run("error cases", func(t *testing.T) {
		t.Run("POST without config identifier header should fail", func(t *testing.T) {
			headers := map[string]string{
				"Content-Type":                      "application/yaml",
				"X-Grafana-Alerting-Merge-Matchers": "environment=test",
			}

			amConfig := PostableAlertmanagerUserConfig{
				AlertmanagerConfig: testAlertmanagerConfigYAML,
			}

			_, status, _ := apiClient.RawConvertPrometheusPostAlertmanagerConfig(t, amConfig, headers)
			requireStatusCode(t, http.StatusBadRequest, status, "")
		})

		t.Run("POST without merge matchers header should fail", func(t *testing.T) {
			headers := map[string]string{
				"Content-Type":                         "application/yaml",
				"X-Grafana-Alerting-Config-Identifier": "test-config",
			}

			amConfig := PostableAlertmanagerUserConfig{
				AlertmanagerConfig: testAlertmanagerConfigYAML,
			}

			_, status, _ := apiClient.RawConvertPrometheusPostAlertmanagerConfig(t, amConfig, headers)
			requireStatusCode(t, http.StatusBadRequest, status, "")
		})

		t.Run("DELETE without config identifier header should fail", func(t *testing.T) {
			headers := map[string]string{}

			_, status, _ := apiClient.RawConvertPrometheusDeleteAlertmanagerConfig(t, headers)
			requireStatusCode(t, http.StatusBadRequest, status, "")
		})
	})

	t.Run("update existing configuration", func(t *testing.T) {
		identifier := "test-update-config"

		headers := map[string]string{
			"Content-Type":                         "application/yaml",
			"X-Grafana-Alerting-Config-Identifier": identifier,
			"X-Grafana-Alerting-Merge-Matchers":    "environment=production",
		}

		amConfig1 := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: testAlertmanagerConfigYAML,
			TemplateFiles: map[string]string{
				"config1.tmpl": `{{ define "config1.template" }}Config 1{{ end }}`,
			},
		}

		response1 := apiClient.ConvertPrometheusPostAlertmanagerConfig(t, amConfig1, headers)
		require.Equal(t, "success", response1.Status)

		// Update the same configuration with new content
		updatedConfigYAML := `
global:
  smtp_smarthost: localhost:25
  smtp_from: updated@example.org

route:
  group_by: ['service']
  group_wait: 5s
  group_interval: 5s
  repeat_interval: 30m
  receiver: updated.hook

receivers:
- name: updated.hook
  webhook_configs:
  - url: 'http://127.0.0.1:8080/updated'
`

		amConfig2 := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: updatedConfigYAML,
			TemplateFiles: map[string]string{
				"updated.tmpl": `{{ define "updated.template" }}Updated Config{{ end }}`,
			},
		}

		response2 := apiClient.ConvertPrometheusPostAlertmanagerConfig(t, amConfig2, headers)
		require.Equal(t, "success", response2.Status)

		// Verify the updated configuration is retrieved
		getHeaders := map[string]string{
			"X-Grafana-Alerting-Config-Identifier": identifier,
		}
		retrievedConfig := apiClient.ConvertPrometheusGetAlertmanagerConfig(t, getHeaders)
		require.NotEmpty(t, retrievedConfig.AlertmanagerConfig)
		require.Contains(t, retrievedConfig.AlertmanagerConfig, "updated@example.org")
		require.Contains(t, retrievedConfig.AlertmanagerConfig, "updated.hook")
		require.Contains(t, retrievedConfig.TemplateFiles, "updated.tmpl")
		require.Equal(t, `{{ define "updated.template" }}Updated Config{{ end }}`, retrievedConfig.TemplateFiles["updated.tmpl"])

		deleteHeaders := map[string]string{
			"X-Grafana-Alerting-Config-Identifier": identifier,
		}
		apiClient.ConvertPrometheusDeleteAlertmanagerConfig(t, deleteHeaders)
	})

	t.Run("multiple extra configurations conflict", func(t *testing.T) {
		firstIdentifier := "first-config"
		secondIdentifier := "second-config"

		// Create first configuration
		firstHeaders := map[string]string{
			"Content-Type":                         "application/yaml",
			"X-Grafana-Alerting-Config-Identifier": firstIdentifier,
			"X-Grafana-Alerting-Merge-Matchers":    "environment=first",
		}

		firstConfig := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: testAlertmanagerConfigYAML,
			TemplateFiles: map[string]string{
				"first.tmpl": `{{ define "first.template" }}First Config{{ end }}`,
			},
		}

		response1 := apiClient.ConvertPrometheusPostAlertmanagerConfig(t, firstConfig, firstHeaders)
		require.Equal(t, "success", response1.Status)

		// Try to create second configuration with different identifier,
		// it should fail because we don't support this yet.
		secondHeaders := map[string]string{
			"Content-Type":                         "application/yaml",
			"X-Grafana-Alerting-Config-Identifier": secondIdentifier,
			"X-Grafana-Alerting-Merge-Matchers":    "environment=second",
		}

		secondConfig := PostableAlertmanagerUserConfig{
			AlertmanagerConfig: `
global:
  smtp_smarthost: localhost:25

route:
  group_by: ['service']
  receiver: second.hook

receivers:
- name: second.hook
  webhook_configs:
  - url: 'http://127.0.0.1:8080/second'
`,
			TemplateFiles: map[string]string{
				"second.tmpl": `{{ define "second.template" }}Second Config{{ end }}`,
			},
		}

		_, status, body := apiClient.RawConvertPrometheusPostAlertmanagerConfig(t, secondConfig, secondHeaders)
		requireStatusCode(t, http.StatusConflict, status, "")
		require.Contains(t, body, "multiple extra configurations are not supported")
		require.Contains(t, body, firstIdentifier)
	})
}
