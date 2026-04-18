import "dotenv/config";
import { ServiceBusClient, ServiceBusReceiver, ProcessErrorArgs, ServiceBusReceivedMessage } from "@azure/service-bus";
import { IParada, IServiceBusMeta } from "@hub/types";

// Tipagem local extraída do servicebus.js original para evitar dependência circular
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

const connStr = process.env.SB_LISTEN_CONNECTION_STRING;
const queueName = process.env.SB_QUEUE_SGO;

if (!connStr || !queueName) {
  console.error("[CONSUMER] Erro: SB_LISTEN_CONNECTION_STRING ou SB_QUEUE_SGO não configurados.");
  process.exit(1);
}

const sbClient = new ServiceBusClient(connStr);
const receiver = sbClient.createReceiver(queueName, { receiveMode: "peekLock" });

const supportedSchemas = new Set(["ParadasSnapshot@1.0"]);

console.log(`[CONSUMER] Iniciando escuta na fila: ${queueName}`);

const subscription = receiver.subscribe({
  processMessage: async (msg: ServiceBusReceivedMessage) => {
    const env: IMessageEnvelope = msg.body;
    const schemaKey = `${env?.schemaName || ""}@${env?.schemaVersion || ""}`;

    if (!supportedSchemas.has(schemaKey)) {
      console.warn(`[CONSUMER] Schema não suportado ignorado: ${schemaKey}`);
      await receiver.deadLetterMessage(msg, {
        deadLetterReason: "INVALID_SCHEMA",
        deadLetterErrorDescription: `Schema não suportado: ${schemaKey}`
      });
      return;
    }

    try {
      console.log(`[CONSUMER] Mensagem recebida: ${msg.messageId} (${env.schemaName})`);
      
      // TODO: No plano de arquitetura, aqui deveríamos salvar no REDIS
      // Por enquanto, apenas logamos o recebimento e completamos a mensagem.
      // Em uma implementação real, o BFF leria do Redis o que o consumer salvou.
      
      await receiver.completeMessage(msg);
      console.log(`[CONSUMER] Mensagem ${msg.messageId} processada com sucesso.`);
    } catch (e: any) {
      console.error(`[CONSUMER] Erro ao processar mensagem ${msg.messageId}:`, e.message);
      // O peekLock fará a mensagem voltar para a fila se não dermos complete nem deadletter
    }
  },
  processError: async (args: ProcessErrorArgs) => {
    console.error(`[CONSUMER] Erro no Service Bus:`, args.error);
  }
});

process.on("SIGINT", async () => {
  console.log("[CONSUMER] Encerrando...");
  await subscription.close();
  await receiver.close();
  await sbClient.close();
  process.exit(0);
});
