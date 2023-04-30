import { OpenAIStream } from '@/utils/server/stream';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { question, chat_history } = (await req.json()) as {
      question: string;
      chat_history: string[][];
    };

    const stream = await OpenAIStream(question, chat_history);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
