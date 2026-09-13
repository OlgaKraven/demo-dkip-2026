using System;
using System.Drawing;
using System.Windows.Forms;

namespace Polesie
{
    public partial class LoginForm : Form
    {
        private readonly PuzzleControl puzzle;

        public LoginForm()
        {
            InitializeComponent();
            puzzle = new PuzzleControl();
            puzzleHost.Controls.Add(puzzle);
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
