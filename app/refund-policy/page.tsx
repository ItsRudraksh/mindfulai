import React from 'react';

const RefundPolicyPage = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-primary mb-4">Cancellation & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated on Jun 30 2025</p>

          <div className="space-y-6 text-lg">
            <p>
              Rudraksh Kapoor believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Cancellations will be considered only if the request is made within 6-8 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.</li>
              <li>Rudraksh Kapoor does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.</li>
              <li>In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 6-8 days of receipt of the products.</li>
              <li>In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 6-8 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.</li>
              <li>In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.</li>
              <li>In case of any Refunds approved by the Rudraksh Kapoor, it'll take 6-8 days for the refund to be processed to the end customer.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage; 