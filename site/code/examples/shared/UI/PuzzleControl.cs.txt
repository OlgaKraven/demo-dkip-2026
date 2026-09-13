using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace Polesie
{
    public class PuzzleControl : UserControl
    {
        private readonly int[] order = { 1, 3, 0, 2 };
        private readonly Button[] tiles = new Button[4];
        private readonly Bitmap[] fragments = new Bitmap[4];
        private readonly Random random = new Random();
        private int selected = -1;

        public PuzzleControl()
        {
            Size = new Size(450, 236);
            var original = new PictureBox { Location = new Point(0, 26), Size = new Size(200, 200), SizeMode = PictureBoxSizeMode.StretchImage };
            string imagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "1.png");
            using (Image source = Image.FromFile(imagePath))
            {
                original.Image = new Bitmap(source);
                using (var scaled = new Bitmap(source, 200, 200))
                {
                    for (int i = 0; i < 4; i++)
                        fragments[i] = scaled.Clone(new Rectangle(i % 2 * 100, i / 2 * 100, 100, 100), scaled.PixelFormat);
                }
            }
            Controls.Add(original);
            Controls.Add(new Label { Text = "Образец", AutoSize = true, Location = new Point(0, 0) });
            Controls.Add(new Label { Text = "Нажмите два фрагмента для обмена", AutoSize = true, Location = new Point(215, 0) });
            for (int i = 0; i < 4; i++)
            {
                int position = i;
                tiles[i] = new Button { Location = new Point(220 + i % 2 * 102, 26 + i / 2 * 102), Size = new Size(102, 102), FlatStyle = FlatStyle.Flat };
                tiles[i].AccessibleName = "Фрагмент " + (i + 1);
                tiles[i].TabIndex = i;
                tiles[i].Click += delegate { SelectTile(position); };
                Controls.Add(tiles[i]);
            }
            Shuffle();
        }

        private void SelectTile(int position)
        {
            if (selected < 0) selected = position;
            else
            {
                int temporary = order[selected];
                order[selected] = order[position];
                order[position] = temporary;
                selected = -1;
            }
            RefreshTiles();
        }

        public bool IsSolved()
        {
            for (int i = 0; i < order.Length; i++)
                if (order[i] != i) return false;
            return true;
        }

        public void Shuffle()
        {
            do
            {
                for (int i = 3; i > 0; i--)
                {
                    int j = random.Next(i + 1);
                    int temporary = order[i];
                    order[i] = order[j];
                    order[j] = temporary;
                }
            } while (IsSolved());
            selected = -1;
            RefreshTiles();
        }

        private void RefreshTiles()
        {
            for (int i = 0; i < 4; i++)
            {
                tiles[i].Image = fragments[order[i]];
                tiles[i].FlatAppearance.BorderColor = selected == i ? Color.Red : Color.Gray;
                tiles[i].FlatAppearance.BorderSize = selected == i ? 3 : 1;
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                foreach (Bitmap fragment in fragments) fragment.Dispose();
                foreach (Control control in Controls)
                    if (control is PictureBox) ((PictureBox)control).Image.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
