namespace Polesie
{
    public class CustomerOrderLine
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public decimal Qty { get; set; }
        public decimal SalePrice { get; set; }
    }
}
