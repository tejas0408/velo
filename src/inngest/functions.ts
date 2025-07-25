import {   openai, createAgent, createTool } from "@inngest/agent-kit";
import { inngest } from "./client";
import {Sandbox} from "@e2b/code-interpreter"
import { stepsSchemas } from "inngest/api/schema";
import { getSanbox } from "./utils";
import { Command } from "lucide-react";
import { stderr, stdout } from "process";
import z from "zod";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async()=>{
    const sandbox = await Sandbox.create(""); 
    return sandbox.sandboxId;
    });
    
    
    const summarizer = createAgent({
      name: "summarizer",
      system: "You are an expert summarizer.  You summarize in 2 words",
      model: openai({ model: "gpt-4o"}),
      tools: [
        createTool({
          name: "terminal",
          description: "use this terminal to run commands",
          parameters : z.object({
            command: z.string(),
          }),
          handler: async ({command}, {step})=> {
            return await step?.run ("terminal", async()=>{
              const buffers= {stdout: "", stderr:""};

              try {
                const sandbox= await getSanbox(sandboxId);
                 const result= await sandbox.commands.run(command, {
                  onStdout: (data: String )=> {
                    buffers.stdout += data;
                  },
                  onStderr: (data : string )=> {
                    buffers.stderr+= data;
                  }
                 });
                 return result.stdout;
              }catch(e){
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror:${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr} `;
              }
            })
          }
        })
      ]
    }); 

    const { output } = await summarizer.run(
  `Summarize the following text: ${event.data.value}`,
);
const sandboxUrl = await step.run("get-sandbox-url", async()=>{
  const sandbox= await getSanbox(sandboxId);
  const host= sandbox.getHost(3000);
  return `https://${host}`;
})
   

    return { output, sandboxUrl };
  },
);