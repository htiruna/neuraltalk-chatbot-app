import { OpenAIStream } from '@/utils/server/stream';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { question, chat_history, namespace } = (await req.json()) as {
      question: string;
      chat_history: string[][];
      namespace: string;
    };

    const stream = await OpenAIStream(question, chat_history, namespace);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
