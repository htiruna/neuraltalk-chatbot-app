import { CallbackManager } from 'langchain/callbacks';
import {
  ConversationalRetrievalQAChain,
  LLMChain,
  loadQAStuffChain,
} from 'langchain/chains';
import { OpenAIChat } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';

const CONDENSE_PROMPT =
  PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT =
  PromptTemplate.fromTemplate(`You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
{context}
Question: {question}
Helpful answer:`);

export const makeChain = (
  vectorStore: SupabaseVectorStore,
  onTokenStream?: (token: string) => void,
  namespace?: string,
) => {
  const temperature = 0;

  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature }),
    prompt: CONDENSE_PROMPT,
  });

  const docChain = loadQAStuffChain(
    new OpenAIChat({
      temperature,
      modelName: 'gpt-3.5-turbo-16k', //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
      streaming: Boolean(onTokenStream),
      callbackManager: onTokenStream
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(token) {
              onTokenStream(token);
            },
          })
        : undefined,
    }),
    { prompt: QA_PROMPT },
  );

  if (namespace) {
    vectorStore.filter = { namespace };
  }

  return new ConversationalRetrievalQAChain({
    retriever: vectorStore.asRetriever(12),
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
};
