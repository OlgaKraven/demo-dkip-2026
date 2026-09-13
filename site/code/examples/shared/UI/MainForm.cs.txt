using System;
using System.Data;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace Polesie
{
    public class MainForm : Form
    {
        private readonly User actor;
        private readonly DataGridView customers = Grid();
        private readonly DataGridView costs = Grid();
        private readonly DataGridView users = Grid();
        private readonly TextBox login = new TextBox { Width = 180, MaxLength = 64 };
        private readonly TextBox password = new TextBox { Width = 180, MaxLength = 256, UseSystemPasswordChar = true };
        private readonly ComboBox role = new ComboBox { Width = 110, DropDownStyle = ComboBoxStyle.DropDownList };
        private readonly CheckBox unlock = new CheckBox { Text = "Снять блокировку", AutoSize = true };
        private readonly TabControl tabs = new TabControl { Dock = DockStyle.Fill };
        private int selectedId;

        public MainForm(User user)
        {
            actor = user;
            Text = "Молочный комбинат «Полесье» — " + actor.Login + " (" + actor.Role + ")";
            Font = new Font("Segoe UI", 10);
            MinimumSize = new Size(880, 600);
            Size = new Size(1150, 720);
            StartPosition = FormStartPosition.CenterScreen;
            Controls.Add(tabs);
            AddCustomers();
            AddCosts();
            if (actor.Role == "admin") AddUsers();
            Reload();
        }

        private static DataGridView Grid()
        {
            return new DataGridView { Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false,
                AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill, SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                MultiSelect = false, RowHeadersVisible = false, BackgroundColor = Color.White };
        }

        private Button Button(string text, EventHandler action)
        {
            var button = new Button { Text = text, AutoSize = true, Height = 36 };
            button.Click += action;
            return button;
        }

        private void AddCustomers()
        {
            var page = new TabPage("Заказчики");
            page.Controls.Add(customers);
            var toolbar = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 46 };
            toolbar.Controls.Add(Button("Обновить", delegate { Safe(Reload); }));
            if (actor.Role == "admin") toolbar.Controls.Add(Button("Импорт Заказчики.json", Import));
            page.Controls.Add(toolbar);
            tabs.TabPages.Add(page);
        }

        private void AddCosts()
        {
            var page = new TabPage("Стоимость заказов");
            page.Controls.Add(costs);
            page.Controls.Add(new Label { Dock = DockStyle.Top, Height = 50, Padding = new Padding(8), Text = "Стоимость материалов с учётом норм и количества. Пустой итог означает: не хватает цены или спецификации." });
            tabs.TabPages.Add(page);
        }

        private void AddUsers()
        {
            var page = new TabPage("Пользователи");
            page.Controls.Add(users);
            var fields = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 165, Padding = new Padding(12), AutoScroll = true };
            role.Items.AddRange(new object[] { "user", "admin" });
            role.SelectedIndex = 0;
            fields.Controls.Add(new Label { Text = "Логин", AutoSize = true });
            fields.Controls.Add(login);
            fields.Controls.Add(new Label { Text = "Новый пароль", AutoSize = true });
            fields.Controls.Add(password);
            fields.Controls.Add(role);
            fields.Controls.Add(unlock);
            fields.SetFlowBreak(unlock, true);
            fields.Controls.Add(Button("Новый пользователь", delegate { selectedId = 0; login.Clear(); password.Clear(); role.SelectedIndex = 0; unlock.Checked = false; }));
            fields.Controls.Add(Button("Сохранить", SaveUser));
            fields.Controls.Add(new Label { Text = "Для изменения выберите строку. Пустой пароль сохраняет прежний; для нового пользователя пароль обязателен.", AutoSize = true, MaximumSize = new Size(760, 0) });
            page.Controls.Add(fields);
            users.CellClick += delegate(object sender, DataGridViewCellEventArgs e)
            {
                if (e.RowIndex < 0) return;
                DataRowView row = (DataRowView)users.Rows[e.RowIndex].DataBoundItem;
                selectedId = Convert.ToInt32(row["id"]);
                login.Text = Convert.ToString(row["login"]);
                role.SelectedItem = Convert.ToString(row["role"]);
                password.Clear();
                unlock.Checked = false;
            };
            tabs.TabPages.Add(page);
        }

        private void Reload()
        {
            customers.DataSource = Db.Table("SELECT id,name,inn,address,phone,is_salesman,is_buyer FROM counterparty ORDER BY id");
            string sql = File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sql", "04-cost.sql"));
            costs.DataSource = Db.Table(sql);
            if (actor.Role == "admin") users.DataSource = Db.Table("SELECT id,login,role,failed_attempts,is_locked FROM users ORDER BY id");
        }

        private void SaveUser(object sender, EventArgs e)
        {
            Safe(delegate
            {
                Users.Save(actor.Id, selectedId, login.Text, password.Text, Convert.ToString(role.SelectedItem), unlock.Checked);
                Reload();
                password.Clear();
                MessageBox.Show("Пользователь сохранён", "Пользователи", MessageBoxButtons.OK, MessageBoxIcon.Information);
            });
        }

        private void Import(object sender, EventArgs e)
        {
            using (var dialog = new OpenFileDialog { Filter = "JSON (*.json)|*.json", Title = "Выберите Заказчики.json" })
            {
                if (dialog.ShowDialog() != DialogResult.OK) return;
                Safe(delegate
                {
                    int count = ImportCustomers.Run(actor.Id, dialog.FileName);
                    Reload();
                    MessageBox.Show("Обработано заказчиков: " + count, "Импорт", MessageBoxButtons.OK, MessageBoxIcon.Information);
                });
            }
        }

        private void Safe(Action action)
        {
            try { action(); }
            catch (InvalidOperationException error)
            {
                MessageBox.Show(error.Message, "Проверьте данные", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception)
            {
                MessageBox.Show("Операция не выполнена. Проверьте соединение, формат файла и уникальность логина; затем обновите таблицу.", "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SelectPage(int index) { tabs.SelectedIndex = index; }
    }
}
