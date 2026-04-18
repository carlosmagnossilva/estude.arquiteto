import { ServiceBusClient, ServiceBusReceiver, ServiceBusSender, ProcessErrorArgs, ServiceBusReceivedMessage } from "@azure/service-bus";
import crypto from "crypto";

export interface IMessageEnvelope {
  queueName: string;
  messageId: string;
  correlationId: string;
  occurredAt: string;
  producer: string;
  schemaName: string;
  schemaVersion: string;
  payload: any;
}

interface BuildEnvelopeArgs {
  queueName: string;
  producer: string;
  schemaName: string;
  schemaVersion: string;
  payload: any;
  correlationId?: string;
}

export function buildEnvelope({ queueName, producer, schemaName, schemaVersion, payload, correlationId }: BuildEnvelopeArgs): IMessageEnvelope {
  return {
    queueName,
    messageId: crypto.randomUUID(),
    correlationId: correlationId || crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    producer,
    schemaName,
    schemaVersion,
    payload
  };
}

interface PublishEnvelopeArgs {
  connectionString: string;
  queueName: string;
  envelope: IMessageEnvelope;
}

export async function publishEnvelope({ connectionString, queueName, envelope }: PublishEnvelopeArgs) {
  const sbClient: ServiceBusClient = new ServiceBusClient(connectionString);
  const sender: ServiceBusSender = sbClient.createSender(queueName);

  const message = {
    messageId: envelope.messageId,
    correlationId: envelope.correlationId,
    subject: envelope.schemaName,
    applicationProperties: {
      schemaVersion: envelope.schemaVersion,
      producer: envelope.producer
    },
    body: envelope
  };

  try {
    await sender.sendMessages(message);
    return { messageId: envelope.messageId, correlationId: envelope.correlationId };
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

interface StartConsumerArgs {
  connectionString: string;
  queueName: string;
  supportedSchemas: Set<string>;
  onValidEnvelope: (env: IMessageEnvelope, msg: ServiceBusReceivedMessage) => Promise<void>;
  onError?: (err: Error) => void;
}

export function startConsumer({ connectionString, queueName, supportedSchemas, onValidEnvelope, onError }: StartConsumerArgs) {
  const sbClient: ServiceBusClient = new ServiceBusClient(connectionString);
  const receiver: ServiceBusReceiver = sbClient.createReceiver(queueName, { receiveMode: "peekLock" });

  const subscription = receiver.subscribe({
    processMessage: async (msg: ServiceBusReceivedMessage) => {
      const env: IMessageEnvelope = msg.body;
      const schemaKey = `${env?.schemaName || ""}@${env?.schemaVersion || ""}`;

      if (!supportedSchemas.has(schemaKey)) {
        await receiver.deadLetterMessage(msg, {
          deadLetterReason: "INVALID_SCHEMA",
          deadLetterErrorDescription: `Schema não suportado: ${schemaKey}`
        });
        return;
      }

      try {
        await onValidEnvelope(env, msg);
        await receiver.completeMessage(msg);
      } catch (e) {
        throw e;
      }
    },
    processError: async (args) => {
      if (onError) onError(args.error);
    }
  });

  async function stop() {
    try { await subscription.close(); } catch {}
    try { await receiver.close(); } catch {}
    try { await sbClient.close(); } catch {}
  }

  return { stop };
}
