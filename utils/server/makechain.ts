import { CallbackManager } from 'langchain/callbacks';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end: {context}

Question: {question}
Helpful answer in markdown:`;

export const makeChain = (
  vectorstore: PineconeStore,
  onTokenStream?: (token: string) => void,
) => {
  const model = new OpenAI({
    temperature: 1,
    modelName: 'gpt-3.5-turbo',
    streaming: Boolean(onTokenStream), // enable streaming
    callbackManager: onTokenStream
      ? CallbackManager.fromHandlers({
          async handleLLMNewToken(token) {
            onTokenStream(token);
          },
        })
      : undefined,
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(),
    {
      qaTemplate: QA_PROMPT,
      questionGeneratorTemplate: CONDENSE_PROMPT,
      returnSourceDocuments: false,
    },
  );

  return chain;
};
