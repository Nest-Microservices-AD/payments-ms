import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY, {});
  private logger = new Logger('PaymentsService');
  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: { orderId: paymentSessionDto.orderId },
      },
      payment_method_types: ['card'],
      line_items: paymentSessionDto.items.map((item) => ({
        price_data: {
          currency: paymentSessionDto.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: envs.SUCCESS_URL,
      cancel_url: envs.CANCEL_URL,
    });
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    if (!req) {
      return res
        .status(400)
        .send('Webhook Error: request does not have rawBody');
    }
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.WEBHOOK_SECRET,
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;

        const payload = {
          stripePaymentId: charge.id,
          orderId: charge.metadata.orderId,
          receiptUrl: charge.receipt_url,
        };
        this.natsClient.emit('payment.success', payload);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return res.status(200).json({ sig });
  }
}
