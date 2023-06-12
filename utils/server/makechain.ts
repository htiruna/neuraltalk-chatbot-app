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
  PromptTemplate.fromTemplate(`"You are a helpful AI assistant. Your task is to deliver comprehensive, concise, and highly readable answers. Use the following pieces of context to answer the question at the end.
- Be succinct: aim to provide short, clear answers that deliver the necessary information. Avoid elaborating unless the details are critical for understanding.
- Avoid repetition: if you've provided the same information earlier in the conversation, there's no need to repeat it.
- Provide context: if your answer refers to another topic that may need further clarification, conclude by asking if the user wants more details on that.
- Be resourceful: if the answer to the question asked is not in the context, respond as if you are an experienced learning and development professional, offering a helpful solution.
- Make it skimmable: format your response for easy skim reading. List no more than seven main points, each as a separate item on a bullet list. If a topic requires more than a single bullet, break it up into sub-points or separate it into different paragraphs.
{context}
Question: {question}
Helpful, clear, and organized answer:"`);

export const makeChain = (
  vectorStore: SupabaseVectorStore,
  onTokenStream?: (token: string) => void,
  namespace?: string,
) => {
  const temperature = 0.7;

  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature }),
    prompt: CONDENSE_PROMPT,
  });

  console.log(QA_PROMPT);

  const docChain = loadQAStuffChain(
    new OpenAIChat({
      temperature,
      modelName: 'gpt-3.5-turbo', //change this to older versions (e.g. gpt-3.5-turbo) if you don't have access to gpt-4
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
    retriever: vectorStore.asRetriever(8),
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
};
