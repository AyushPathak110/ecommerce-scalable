import { kafka } from "../../config/kafka.js";
import nodemailer from "nodemailer";
import { config } from "../../config/index.js";
import { ProductService } from "../product/product.service.js";

const consumer = kafka.consumer({
  groupId: "email-service",
});

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export async function startEmailConsumer() {
  const productService = new ProductService();
  await consumer.connect();
  await consumer.subscribe({
    topic: "order.placed",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      try {
        const product = await productService
          .getById(event.productId)
          .catch(() => null);

        if (!config.smtpUser || !config.smtpPass) {
          console.warn("SMTP credentials not configured. Skipping email send.");
        } else {
          await transporter.sendMail({
            from: `"Scalable Ecommerce" <${config.smtpUser}>`,
            to: "anything6o9o@gmail.com",
            subject: `Order Confirmation #${event.orderId}`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
                <h1 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">Order Confirmation</h1>
                
                <div style="background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <p style="font-size: 16px; color: #374151;">Thank you for your purchase! We've received your order and it's being processed.</p>
                  
                  <div style="margin: 25px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
                    <h2 style="font-size: 18px; margin-bottom: 15px; color: #1f2937;">Order Summary</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Order #:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${event.orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Product:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${product?.name || event.productId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Quantity:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${event.quantity}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; color: #1f2937; font-size: 18px; font-weight: bold;">Total Paid:</td>
                        <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; text-align: right; color: #4f46e5; font-size: 20px; font-weight: bold;">₹${event.price}</td>
                      </tr>
                    </table>
                  </div>
                </div>
                
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
                  &copy; 2026 Scalable Ecommerce. All rights reserved.<br>
                  This is an automated email, please do not reply.
                </p>
              </div>
            `,
          });
          console.log(`Email sent successfully for order ${event.orderId}`);
        }
      } catch (error) {
        console.error("Failed to send email:", error);
      }

      console.log(`Log: Email sent for order ${event.orderId} (₹${event.price})`);
    },
  });
}
