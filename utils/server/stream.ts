import { makeChain } from './makechain';

import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';

export const OpenAIStream = async (
  question: string,
  chat_history: string[][],
  namespace: string,
) => {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_KEY');
  }

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  const stream = new ReadableStream({
    async start(controller) {
      const embeddings = new OpenAIEmbeddings();

      const vectorStore = new SupabaseVectorStore(embeddings, { client });

      const encoder = new TextEncoder();

      const sendData = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      sendData(' ');

      // create chain
      const chain = makeChain(
        vectorStore,
        (token: string) => {
          sendData(token);
        },
        namespace,
      );

      try {
        // Ask a question
        await chain.call({
          question: sanitizedQuestion,
          chat_history: chat_history || [],
        });
      } catch (error) {
        console.log('error', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
};
