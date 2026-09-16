using System;
using System.Windows.Forms;

namespace PolesieTraining
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void enter_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(login.Text))
            {
                MessageBox.Show("Введите логин");
                return;
            }
            MessageBox.Show("Кнопка работает. Следующий шаг — подключение к базе.");
        }
    }
}
