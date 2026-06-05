"use client";

import {
  Disc3Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioViewerProps {
  artifactId: string;
}

function formatTime(seconds: number) {
  if (Number.isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function AudioViewer({ artifactId }: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlayEvent);
    audio.addEventListener("pause", handlePauseEvent);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlayEvent);
      audio.removeEventListener("pause", handlePauseEvent);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch((err) => {
          console.error("Playback failed:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleSeek = (value: number | readonly number[]) => {
    const seekTo = Array.isArray(value) ? value[0] : value;
    if (audioRef.current && seekTo !== undefined) {
      audioRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-12 gap-10">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex size-32 items-center justify-center rounded-full bg-primary/10 shadow-lg shadow-primary/5">
          <Disc3Icon 
            className={cn(
              "size-14 text-primary transition-all duration-500",
              isPlaying ? "animate-[spin_4s_linear_infinite]" : ""
            )} 
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Podcast Audio
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            AI Generated
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* biome-ignore lint/a11y/useMediaCaption: Audio player doesn't use captions */}
        <audio
          ref={audioRef}
          src={`/api/artifacts/${artifactId}/audio`}
          className="hidden"
        />

        <div className="flex items-center justify-between gap-4">
          <span className="w-10 text-right text-xs font-medium text-muted-foreground tabular-nums">
            {formatTime(currentTime)}
          </span>
          <Slider
            className="flex-1"
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
          />
          <span className="w-10 text-xs font-medium text-muted-foreground tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        <div className="relative flex w-full items-center justify-center gap-6 pt-2">
          <button
            type="button"
            onClick={() => skip(-15)}
            className="text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            aria-label="Skip backward 15 seconds"
          >
            <RotateCcwIcon className="size-5" />
          </button>
          
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="size-5 fill-current" />
            ) : (
              <PlayIcon className="size-5 fill-current ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skip(15)}
            className="text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            aria-label="Skip forward 15 seconds"
          >
            <RotateCwIcon className="size-5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="absolute right-0 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeXIcon className="size-5" />
            ) : (
              <Volume2Icon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
