using System;
using System.Drawing;
using System.Windows.Forms;

namespace Polesie
{
    public class LoginForm : Form
    {
        private readonly TextBox login = new TextBox { Width = 300, MaxLength = 64 };
        private readonly TextBox password = new TextBox { Width = 300, MaxLength = 256, UseSystemPasswordChar = true };
        private readonly PuzzleControl puzzle = new PuzzleControl();

        public LoginForm()
        {
            Text = "Молочный комбинат «Полесье» — вход";
            MinimumSize = new Size(660, 570);
            Size = new Size(720, 640);
            Font = new Font("Segoe UI", 10);
            StartPosition = FormStartPosition.CenterScreen;
            var layout = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, Padding = new Padding(28), AutoScroll = true };
            layout.Controls.Add(new Label { Text = "Молочный комбинат «Полесье»", AutoSize = true, Font = new Font(Font.FontFamily, 20, FontStyle.Bold) });
            layout.Controls.Add(new Label { Text = "Логин", AutoSize = true });
            layout.Controls.Add(login);
            layout.Controls.Add(new Label { Text = "Пароль", AutoSize = true });
            layout.Controls.Add(password);
            layout.Controls.Add(new Label { Text = "Соберите изображение, затем нажмите «Войти»", AutoSize = true, Margin = new Padding(3, 18, 3, 8) });
            layout.Controls.Add(puzzle);
            var enter = new Button { Text = "Войти", Width = 150, Height = 40, BackColor = Color.FromArgb(210, 32, 46), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            enter.Click += SignIn;
            layout.Controls.Add(enter);
            AcceptButton = enter;
            Controls.Add(layout);
        }

        private void SignIn(object sender, EventArgs e)
        {
            try
            {
                User user = AuthService.SignIn(login.Text, password.Text, puzzle.IsSolved());
                MessageBox.Show("Вы успешно авторизовались", "Вход", MessageBoxButtons.OK, MessageBoxIcon.Information);
                Hide();
                try
                {
                    using (var main = new MainForm(user)) main.ShowDialog();
                }
                finally
                {
                    password.Clear();
                    puzzle.Shuffle();
                    Show();
                }
            }
            catch (InvalidOperationException error)
            {
                MessageBox.Show(error.Message, "Вход", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception)
            {
                MessageBox.Show("Не удалось подключиться к базе. Проверьте запуск сервера, имя базы и connection.local.txt.", "Соединение", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
