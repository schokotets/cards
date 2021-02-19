<script>
	import marked from 'marked'

	let question
	let answershown = false

	function loadQuestion() {
		fetch('/questions/random')
			.then(response => response.json())
			.then(data => { question = data } )
	}

	function showAnswer() {
		answershown = true
	}

	function loadNewQuestions() {
		fetch('/questions/reload')
	}

	loadQuestion()
</script>

<div class="quiz">
<main>
	<h1>Karten lernen</h1>
	<button on:click={loadNewQuestions}>Neue Fragen laden</button>
	{#if question && Object.keys(question).length > 0}
	<div class="card">
		<h2>{question.question}</h2>
		{#if answershown}
		<p>{@html marked(question.answer)}</p>
		{/if}
	</div>
	{/if}
</main>
<footer>
	<button on:click={showAnswer}>Antwort zeigen</button>
	<button on:click={loadQuestion}>nächste Frage</button>
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
