import React from "react";
import { SnackbarProvider } from "./Snackbar/Context";
import { ChannelProvider } from "./ChannelPage/Context";
import { ConnectionProvider } from "./App/Context";
import { QueueProvider } from "./Queue/Context";
import { PlaybackProvider } from "./PlaybackControls/Context";

export function MpdStateProvider({ initial, children }) {
	return <ChannelProvider initial={initial.channels}>
		<ConnectionProvider>
			<SnackbarProvider>
				<QueueProvider initial={initial.queue}>
					<PlaybackProvider initial={initial.playback}>
						{ children }
					</PlaybackProvider>
				</QueueProvider>
			</SnackbarProvider>
		</ConnectionProvider>
	</ChannelProvider>
}

