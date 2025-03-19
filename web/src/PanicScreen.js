import React from "react";

export function PanicScreen({uncaughtPromise, obj}) {
	let contents;
	if (obj instanceof Error) {
		contents = <p>{obj.toString()}</p>;
	} else if (obj instanceof Response) {
		contents = <>
			<p><b>The application provided a fetch Response object for context</b></p>
			<p>Status: {obj.status} {obj.statusText}</p>
		</>
	} else if (obj === undefined) {
		contents = <p>No further context was provided.</p>
	} else {
		contents = <p>The provided context (type {typeof obj}) could not be interpreted.</p>
	}
	return <>
		<h1>An Unexpected Issue Occurred</h1>
		<p><b>{uncaughtPromise ? "Uncaught Promise" : "Standard Error"}</b></p>
		<h2>Context</h2>
		{contents}
	</>;
}
