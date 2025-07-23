import { email, z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { invokePayloadSchema } from 'inngest/components/InngestStepTools';
import { inngest } from '@/inngest/client';
import { Value } from '@radix-ui/react-select';
export const appRouter = createTRPCRouter({
  invoke : baseProcedure
    .input(

      z.object({
        value: z.string(),
      })
    )
    .mutation(async({input})=>{
      await inngest.send({
        name:"test/hello.world",
        data: {
          value: input.value,
        }
      })

    }),
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;