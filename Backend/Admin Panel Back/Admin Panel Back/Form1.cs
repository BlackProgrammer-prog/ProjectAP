using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net.Http;
using System.Net.Http.Headers;
using System.IO;
using Newtonsoft.Json.Linq;
using Websocket.Client;

namespace Admin_Panel_Back
{
    public partial class Panel : Form
    {
        private WebsocketClient _wsClient;
        private IDisposable _wsSubscription;
        private readonly Uri _serverLogUri = new Uri("ws://localhost:9030");
        private readonly HttpClient _httpClient = new HttpClient { BaseAddress = new Uri("http://localhost:9010") };

        public Panel()
        {
            InitializeComponent();
        }

        private void Panel_Load(object sender, EventArgs e)
        {
            // Hook click for "وضعیت" combo to start showing server logs
            this.toolStripComboBox2.Click += this.toolStripComboBox2_Click;
            // Hook data query on table selection
            this.comboBox1.SelectedIndexChanged += this.comboBox1_SelectedIndexChanged;
            // Hook print CSV button
            this.button15.Click += this.button15_Click;
        }

        private void Header_Click(object sender, EventArgs e)
        {

        }

        private void toolStripStatusLabel1_Click(object sender, EventArgs e)
        {

        }

        private async void toolStripComboBox2_Click(object sender, EventArgs e)
        {
            UpdateStatusTextSafe("در حال اتصال به ws://localhost:9030 ...");
            try
            {
                await EnsureWebSocketConnectedAsync();
            }
            catch (Exception ex)
            {
                UpdateStatusTextSafe("خطا در اتصال: " + ex.Message);
            }
        }

        private async Task EnsureWebSocketConnectedAsync()
        {
            if (_wsClient != null)
            {
                return;
            }

            _wsClient = new WebsocketClient(_serverLogUri)
            {
                ReconnectTimeout = TimeSpan.FromSeconds(30)
            };

            _wsSubscription = _wsClient.MessageReceived.Subscribe(msg =>
            {
                var text = msg.Text;
                if (string.IsNullOrWhiteSpace(text)) return;
                try
                {
                    var json = JObject.Parse(text);
                    UpdateStatusGridSafe(json);
                }
                catch (Exception ex)
                {
                    UpdateStatusTextSafe("خطا در پردازش پیام: " + ex.Message);
                }
            });

            await _wsClient.Start();
        }

        private void UpdateStatusGridSafe(JObject json)
        {
            if (this.IsDisposed) return;
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => UpdateStatusGrid(json)));
            }
            else
            {
                UpdateStatusGrid(json);
            }
        }

        private void UpdateStatusTextSafe(string text)
        {
            if (this.IsDisposed) return;
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => UpdateStatusTextSafe(text)));
                return;
            }

            var dt = new DataTable();
            dt.Columns.Add("Key");
            dt.Columns.Add("Value");
            dt.Rows.Add("Info", text);
            this.dataGridView1.DataSource = dt;
            this.TableName.Text = ":Status";
        }

        private void UpdateStatusGrid(JObject j)
        {
            var dt = new DataTable();
            dt.Columns.Add("Key");
            dt.Columns.Add("Value");

            dt.Rows.Add("timestamp", (string)j["timestamp"] ?? string.Empty);

            var cpu = j["cpu"] as JObject;
            if (cpu != null)
            {
                dt.Rows.Add("cpu.avgLoad", cpu["avgLoad"]?.ToString());
                dt.Rows.Add("cpu.currentLoad", cpu["currentLoad"]?.ToString());
                var perCore = cpu["perCore"] as JArray;
                if (perCore != null)
                {
                    dt.Rows.Add("cpu.perCore", string.Join(", ", perCore.Select(x => x?.ToString())));
                }
            }

            var mem = j["memory"] as JObject;
            if (mem != null)
            {
                dt.Rows.Add("memory.used", mem["used"]?.ToString());
                dt.Rows.Add("memory.total", mem["total"]?.ToString());
                dt.Rows.Add("memory.free", mem["free"]?.ToString());
                dt.Rows.Add("memory.available", mem["available"]?.ToString());
            }

            var proc = j["processes"] as JObject;
            if (proc != null)
            {
                dt.Rows.Add("processes.all", proc["all"]?.ToString());
                dt.Rows.Add("processes.running", proc["running"]?.ToString());
                dt.Rows.Add("processes.blocked", proc["blocked"]?.ToString());
                var top = proc["listTop"] as JArray;
                if (top != null && top.Count > 0)
                {
                    for (int i = 0; i < Math.Min(5, top.Count); i++)
                    {
                        var p = top[i] as JObject;
                        if (p == null) continue;
                        dt.Rows.Add($"top[{i}]", $"{p["name"]} (pid {p["pid"]}) cpu {p["cpu"]}% mem {p["mem"]}%");
                    }
                }
            }

            var time = j["time"] as JObject;
            if (time != null)
            {
                dt.Rows.Add("time.uptime", time["uptime"]?.ToString());
            }

            var error = j["error"]?.ToString();
            if (!string.IsNullOrWhiteSpace(error))
            {
                dt.Rows.Add("error", error);
            }

            this.dataGridView1.DataSource = dt;
            this.TableName.Text = ":Status";
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            _wsSubscription?.Dispose();
            _wsClient?.Dispose();
            base.OnFormClosing(e);
        }

        private async void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            var selected = this.comboBox1.SelectedItem as string;
            if (string.IsNullOrWhiteSpace(selected)) return;
            try
            {
                await LoadTableAsync(selected);
            }
            catch (Exception ex)
            {
                UpdateStatusTextSafe("خطای API: " + ex.Message);
            }
        }

        private async Task LoadTableAsync(string tableName)
        {
            this.TableName.Text = ":" + tableName;
            var query = $"SELECT * FROM \"{tableName}\"";
            await QueryAndBindAsync(query);
        }

        //----------------------------------------------------
        public async Task QueryAndBindAsync(string sql)
        {
            var payload = new JObject
            {
                ["query"] = sql
            };

            using (var content = new StringContent(payload.ToString(), Encoding.UTF8, "application/json"))
            {
                using (var resp = await _httpClient.PostAsync("/query", content))
                {
                    var body = await resp.Content.ReadAsStringAsync();
                    if (!resp.IsSuccessStatusCode)
                    {
                        UpdateStatusTextSafe($"HTTP {(int)resp.StatusCode}: {body}");
                        return;
                    }

                    var json = JObject.Parse(body);
                    if ((bool?)json["ok"] != true)
                    {
                        UpdateStatusTextSafe("API Error: " + (string)json["error"]);
                        return;
                    }

                    var rows = json["rows"] as JArray;
                    if (rows != null && rows.Count > 0)
                    {
                        var dt = ConvertRowsToDataTable(rows);
                        BindDataTableSafe(dt);
                    }
                    else
                    {
                        var info = new DataTable();
                        info.Columns.Add("Key");
                        info.Columns.Add("Value");
                        info.Rows.Add("rowcount", json["rowcount"]?.ToString());
                        info.Rows.Add("last_row_id", json["last_row_id"]?.ToString());
                        info.Rows.Add("duration_ms", json["duration_ms"]?.ToString());
                        BindDataTableSafe(info);
                    }
                }
            }
        }

        private static DataTable ConvertRowsToDataTable(JArray rows)
        {
            var dt = new DataTable();

            // Build columns as union of keys across all rows
            var columnNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var token in rows)
            {
                if (token is JObject obj)
                {
                    foreach (var prop in obj.Properties())
                    {
                        if (columnNames.Add(prop.Name))
                        {
                            dt.Columns.Add(prop.Name);
                        }
                    }
                }
            }

            // Fill data
            foreach (var token in rows)
            {
                var row = dt.NewRow();
                if (token is JObject obj)
                {
                    foreach (var col in columnNames)
                    {
                        var value = obj[col];
                        row[col] = JTokenToObject(value);
                    }
                }
                dt.Rows.Add(row);
            }

            return dt;
        }

        private static object JTokenToObject(JToken token)
        {
            if (token == null || token.Type == JTokenType.Null) return DBNull.Value;
            if (token is JValue v) return v.Value ?? DBNull.Value;
            return token.ToString();
        }

        private void BindDataTableSafe(DataTable dt)
        {
            if (this.IsDisposed) return;
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => this.dataGridView1.DataSource = dt));
            }
            else
            {
                this.dataGridView1.DataSource = dt;
            }
        }

        private void button15_Click(object sender, EventArgs e)
        {
            if (this.dataGridView1 == null || this.dataGridView1.Columns.Count == 0)
            {
                UpdateStatusTextSafe("داده‌ای برای چاپ وجود ندارد.");
                return;
            }

            using (var sfd = new SaveFileDialog())
            {
                sfd.Filter = "CSV files (*.csv)|*.csv";
                sfd.FileName = $"{(this.TableName?.Text ?? "Data").Trim(':').Replace(' ', '_')}_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
                if (sfd.ShowDialog() != DialogResult.OK) return;

                var csv = BuildCsvFromGrid(this.dataGridView1);
                File.WriteAllText(sfd.FileName, csv, new UTF8Encoding(encoderShouldEmitUTF8Identifier: true));
                UpdateStatusTextSafe("CSV با موفقیت ذخیره شد: " + sfd.FileName);
            }
        }

        private static string BuildCsvFromGrid(DataGridView grid)
        {
            var sb = new StringBuilder();

            // Headers
            var headerValues = new List<string>();
            foreach (DataGridViewColumn col in grid.Columns)
            {
                if (!col.Visible) continue;
                headerValues.Add(EscapeCsv(col.HeaderText));
            }
            sb.AppendLine(string.Join(",", headerValues));

            // Rows
            foreach (DataGridViewRow row in grid.Rows)
            {
                if (row.IsNewRow) continue;
                var cellValues = new List<string>();
                foreach (DataGridViewCell cell in row.Cells)
                {
                    if (!cell.Visible) continue;
                    var value = cell.Value?.ToString() ?? string.Empty;
                    cellValues.Add(EscapeCsv(value));
                }
                sb.AppendLine(string.Join(",", cellValues));
            }

            return sb.ToString();
        }

        private static string EscapeCsv(string input)
        {
            if (input == null) return string.Empty;
            var mustQuote = input.Contains(",") || input.Contains("\"") || input.Contains("\n") || input.Contains("\r");
            var s = input.Replace("\"", "\"\"");
            return mustQuote ? "\"" + s + "\"" : s;
        }
    }
}
