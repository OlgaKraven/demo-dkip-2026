using System;
using System.Data;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace Polesie
{
    public partial class MainForm : Form
    {
        private readonly User actor;
        private int selectedId;

        public MainForm()
        {
            InitializeComponent();
            role.SelectedIndex = 0;
        }

        public MainForm(User user) : this()
        {
            actor = user;
            Text += " — " + actor.Login + " (" + actor.Role + ")";
            if (actor.Role != "admin")
            {
                tabs.TabPages.Remove(usersPage);
                importButton.Visible = false;
            }
            Reload();
        }

        private void RefreshData(object sender, EventArgs e) { Safe(Reload); }

        private void NewUser(object sender, EventArgs e)
        {
            selectedId = 0;
            login.Clear();
            password.Clear();
            role.SelectedIndex = 0;
            unlock.Checked = false;
        }

        private void SelectUser(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;
            DataRowView row = (DataRowView)users.Rows[e.RowIndex].DataBoundItem;
            selectedId = Convert.ToInt32(row["id"]);
            login.Text = Convert.ToString(row["login"]);
            role.SelectedItem = Convert.ToString(row["role"]);
            password.Clear();
            unlock.Checked = false;
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
