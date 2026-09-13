using System;
using System.Windows.Forms;

namespace Polesie
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            try
            {
                Application.Run(new LoginForm());
            }
            catch (Exception)
            {
                MessageBox.Show("Не удалось открыть приложение. Проверьте папку Assets рядом с программой.",
                    "Запуск", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
