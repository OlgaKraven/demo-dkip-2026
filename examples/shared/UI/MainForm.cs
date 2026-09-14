using System;
using System.Data;
using System.Windows.Forms;

namespace Polesie
{
    public partial class MainForm : Form
    {
        private readonly User actor;
        private int selectedId;
        private bool loadingUsers;

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
            users.CurrentCell = null;
            users.ClearSelection();
            selectedId = 0;
            login.Clear();
            password.Clear();
            role.SelectedIndex = 0;
            unlock.Checked = false;
        }

        private void SelectUser(object sender, DataGridViewCellEventArgs e)
        {
            if (loadingUsers || e.RowIndex < 0 || users.Rows[e.RowIndex].DataBoundItem == null) return;
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
            string sql = @"SELECT o.id AS order_id, o.doc_no,
       CASE WHEN COUNT(l.id)=0 THEN 0
            WHEN SUM(CASE WHEN s.id IS NULL OR sm.material_id IS NULL OR p.amount IS NULL THEN 1 ELSE 0 END)>0 THEN NULL
            ELSE ROUND(SUM(l.qty / s.output_qty * sm.qty * p.amount), 2)
       END AS material_cost
FROM customer_order o
LEFT JOIN customer_order_line l ON l.order_id=o.id
LEFT JOIN specification s ON s.product_id=l.product_id
LEFT JOIN specification_material sm ON sm.specification_id=s.id
LEFT JOIN price p ON p.item_id=sm.material_id
 AND p.valid_from=(SELECT MAX(p2.valid_from) FROM price p2 WHERE p2.item_id=sm.material_id AND p2.valid_from<=o.doc_date)
GROUP BY o.id,o.doc_no
ORDER BY o.id;";
            costs.DataSource = Db.Table(sql);
            if (actor.Role == "admin")
            {
                DataTable data = Db.Table("SELECT id,login,role,failed_attempts,is_locked FROM users ORDER BY id");
                loadingUsers = true;
                try
                {
                    users.DataSource = data;
                    NewUser(this, EventArgs.Empty);
                }
                finally { loadingUsers = false; }
            }
        }

        private void SaveUser(object sender, EventArgs e)
        {
            Safe(delegate
            {
                Users.Save(actor.Id, selectedId, login.Text, password.Text, Convert.ToString(role.SelectedItem), unlock.Checked);
                password.Clear();
                MessageBox.Show("Пользователь сохранён", "Пользователи", MessageBoxButtons.OK, MessageBoxIcon.Information);
                RefreshAfterSave();
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
                    MessageBox.Show("Обработано заказчиков: " + count, "Импорт", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    RefreshAfterSave();
                });
            }
        }

        private void RefreshAfterSave()
        {
            try { Reload(); }
            catch (Exception)
            {
                MessageBox.Show("Данные сохранены. Таблицу обновить не удалось. Проверьте соединение и нажмите «Обновить».", "Обновление", MessageBoxButtons.OK, MessageBoxIcon.Warning);
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
