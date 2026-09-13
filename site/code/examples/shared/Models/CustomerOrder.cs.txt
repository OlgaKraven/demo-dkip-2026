using System;

namespace Polesie
{
    public class CustomerOrder
    {
        public int Id { get; set; }
        public string DocNo { get; set; }
        public DateTime DocDate { get; set; }
        public string CustomerId { get; set; }
        public string ExecutorId { get; set; }
    }
}
