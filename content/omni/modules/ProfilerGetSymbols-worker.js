"use strict";importScripts("resource://gre/modules/osfile.jsm","resource://gre/modules/profiler_get_symbols.js");

const{WasmMemBuffer,get_compact_symbol_table}=wasm_bindgen;function readFileInto(file,dataBuf){


const dataBufLen=dataBuf.byteLength;const chunkSize=4*1024*1024;let pos=0;while(pos<dataBufLen){const chunkData=file.read({bytes:chunkSize});const chunkBytes=chunkData.byteLength;if(chunkBytes===0){break;}
dataBuf.set(chunkData,pos);pos+=chunkBytes;}}

function createPlainErrorObject(e){

if(!(e instanceof OS.File.Error)){if(e instanceof Error){const{name,message,fileName,lineNumber}=e;return{name,message,fileName,lineNumber};}
if(e.error_type){return{name:e.error_type,message:e.error_msg,};}}
return{name:e instanceof OS.File.Error?"OSFileError":"Error",message:e.toString(),fileName:e.fileName,lineNumber:e.lineNumber,};}
onmessage=async e=>{try{const{binaryPath,debugPath,breakpadId,module}=e.data;if(!(module instanceof WebAssembly.Module)){throw new Error("invalid WebAssembly module");}
await wasm_bindgen(module);const binaryFile=OS.File.open(binaryPath,{read:true});const binaryData=new WasmMemBuffer(binaryFile.stat().size,array=>{readFileInto(binaryFile,array);});binaryFile.close();
let debugData=binaryData;if(debugPath&&debugPath!==binaryPath){const debugFile=OS.File.open(debugPath,{read:true});debugData=new WasmMemBuffer(debugFile.stat().size,array=>{readFileInto(debugFile,array);});debugFile.close();}
try{let output=get_compact_symbol_table(binaryData,debugData,breakpadId);const result=[output.take_addr(),output.take_index(),output.take_buffer(),];output.free();postMessage({result},result.map(r=>r.buffer));}finally{binaryData.free();if(debugData!=binaryData){debugData.free();}}}catch(error){postMessage({error:createPlainErrorObject(error)});}
close();};