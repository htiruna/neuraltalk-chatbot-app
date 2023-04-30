import { makeChain } from './makechain';

import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseHybridSearch } from 'langchain/retrievers/supabase';

export const OpenAIStream = async (
  question: string,
  chat_history: string[][],
) => {
  const client = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_KEY ?? '',
  );
  if (!process.env.SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL');
  }

  if (!process.env.SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_KEY');
  }

  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  const stream = new ReadableStream({
    async start(controller) {
      const embeddings = new OpenAIEmbeddings();

      const retriever = new SupabaseHybridSearch(embeddings, {
        client,
        //  Below are the defaults, expecting that you set up your supabase table and functions according to the guide above. Please change if necessary.
        similarityK: 8,
        keywordK: 8,
        tableName: 'documents',
        similarityQueryName: 'match_documents',
        keywordQueryName: 'kw_match_documents',
      });

      const encoder = new TextEncoder();

      const sendData = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      sendData(' ');

      // create chain
      const chain = makeChain(retriever, (token: string) => {
        sendData(token);
      });

      try {
        // Ask a question
        const response = await chain.call({
          question: sanitizedQuestion,
          chat_history: chat_history || [],
        });

        console.log('response', response);
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
