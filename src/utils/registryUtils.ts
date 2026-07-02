import { ManifestManager } from "../managers/manifestManager";
import * as fs from "fs";


export const updateFileName = (manifestManager: ManifestManager, newName: string, oldName: string) => {

    console.log("newName before", newName);
    console.log("oldName before", oldName);


   if (!newName.endsWith(".json")) {
    newName = `${newName}.json`;
   }

   if (!oldName.endsWith(".json")) {
    oldName = `${oldName}.json`;
   }

   console.log("newName after", newName);
   console.log("oldName after", oldName);

    try {
        fs.renameSync(
        manifestManager.createManifestFilePath(oldName),
        manifestManager.createManifestFilePath(newName)
       );
    } catch (error) {
        throw new Error(`Error updating file name: ${error}`);
    }
}