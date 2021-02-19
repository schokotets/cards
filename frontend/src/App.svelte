<script>
	import marked from 'marked'

	let questions = []
	let answershown = false

	$: randomindex = 0

	function parseQuestions(text) {
		window.text = text
		let combined = text.split('\n\n').slice(1)
		questions = combined.map(pair => {
			let split = pair.split("\n")
			let question = split[0].slice(5)
			let answer = split.slice(1).join("\n")
			return { question, answer }
		})
		nextRandomindex()
	}

	fetch('/randomquestion')
		.then(response => response.text())
		.then(parseQuestions)

	function showAnswer() {
		answershown = true
	}

	const rnd = (min,max) => { return Math.floor(Math.random() * (max - min + 1) + min) };

	function nextRandomindex() {
		answershown = false
		let num = rnd(0,questions.length-2)
		if(num >= randomindex) {
			randomindex = num + 1
		} else {
			randomindex = num
		}
	}
</script>

<div class="quiz">
<main>
	<h1>Karten lernen</h1>
	{#if questions.length > 0}
	<div class="card">
		<h2>{questions[randomindex].question}</h2>
		{#if answershown}
		<p>{@html marked(questions[randomindex].answer)}</p>
		{/if}
	</div>
	{/if}
</main>
<footer>
	<button on:click={showAnswer}>Antwort zeigen</button>
	<button on:click={nextRandomindex}>nächste Frage</button>
</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.quiz {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
	}

	main, footer {
		margin: 1em;
	}
</style>
