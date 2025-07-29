import {   openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { inngest } from "./client";
import {Sandbox} from "@e2b/code-interpreter"
import { stepsSchemas } from "inngest/api/schema";
import { getSanbox, lastAssistantTextMessageContent } from "./utils";
import { Command, Files } from "lucide-react";
import { stderr, stdout } from "process";
import {z, ZodType} from "zod";
import { Content } from "vaul";
import { handler } from "next/dist/build/templates/app-page";
import { PROMPT } from "@/prompts";
import { nextTest } from "next/dist/cli/next-test";
import { ZodTypeAny } from "inngest/helpers/validators/zod";




export const helloWorld = inngest.createFunction(
   async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async()=>{
    const sandbox = await Sandbox.create(""); 
    return sandbox.sandboxId;
    });
    
    
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-4.1",
      defaultParameters:{
           temperature: 0.1,

      }
    }),
      tools: [
        createTool({
          name: "terminal",
          description: "use this terminal to run commands",
          parameters : z.object({
            command: z.string(),
          })as ZodTypeAny
          

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
            });
          },
          }),
          createTool({
            name: "createupdatefiles",
            description: "Create or update files in the sandbox",
            parameters: z.object ({
              files: z.array(
                z.object({
                  path: z.string(),
                  content: z.string(),
                }),
              ),
              
            }),
           handler: async(
            {files}, 
            {step, network}
           )=>{
            const newfiles= await step?.run("createOrUpdateFiles", async()=>{
              try {
                const updatedfiles= network.state.data.files || {};
                const sandbox= await getSanbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedfiles[file.path]= file.content;
                }
                return updatedfiles;
              } catch (e) {
                return "Error:"+e;
                
              }
            });

             if(typeof newfiles === "object"){
              network.state.data.files = newfiles;
              
             }

           }
          
        }),
         
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object(z.string()),

        }),
         handler: async ({files}, {steps})=>{
          return await step?.run("readFiles", async()=>{
            try {
              const sandbox= await getSanbox(sandboxId);
              const contents= [];
              for (const file of files){
                const content = await sandbox.files.read(file);
                contents.push({path: file, content});
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "Error: "+ e;
              
            }
          })
         }, 
      ],
      lifecycle:{
        onResponse: async ({result, network}=> {
          const lastAssistantMessageText= lastAssistantTextMessageContent(result);

          if(lastAssistantMessageText && network){
            if(lastAssistantMessageText.includes("<task_summary>")){
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;

        }),
      }
    }); 

    const network= createNetwork({
      name:"coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async({network})=>{
        const summary = network.state.data.summary;
        if (summary){
          return;
        }
        return codeAgent;
      }
    })

   const result = await network.run(event.data.value);
);
const sandboxUrl = await step.run("get-sandbox-url", async()=>{
  const sandbox= await getSanbox(sandboxId);
  const host= sandbox.getHost(3000);
  return `https://${host}`;
})
   

    return {  
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,  
    };
  },
);