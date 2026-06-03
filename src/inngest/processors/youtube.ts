import { YoutubeTranscript } from "youtube-transcript";
import { cleanTranscriptText } from "../utils";

export async function processYoutube(sourceUrl: string): Promise<string> {
  const transcript = await YoutubeTranscript.fetchTranscript(sourceUrl);
  return cleanTranscriptText(transcript);
}
