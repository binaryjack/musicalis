
import { Button } from "../atoms/button";
import { Slider } from "../atoms/slider";

export type PlaybackBarProps = any;

export const PlaybackBar = function(props: PlaybackBarProps) { return (<div className="playback-bar"><Button onClick={props.onPlayPause}>{props.isPlaying ? "Pause" : "Play"}</Button><Button onClick={props.onStop}>Stop</Button><Slider min={0} max={100} value={props.progress} onChange={props.onSeek} /></div>); };