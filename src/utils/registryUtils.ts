import { ManifestManager } from "../managers/manifestManager";
import * as fs from "fs";


export const updateFileName = (manifestManager: ManifestManager, newName: string, oldName: string) => {

   if (!newName.endsWith(".json")) {
    newName = `${newName}.json`;
   }

   if (!oldName.endsWith(".json")) {
    oldName = `${oldName}.json`;
   }

    try {
        fs.renameSync(
        manifestManager.createManifestFilePath(oldName),
        manifestManager.createManifestFilePath(newName)
       );
    } catch (error) {
        throw new Error(`Error updating file name: ${error}`);
    }
}