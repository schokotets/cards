const fs = require("fs")
const util = require("util")
const exec = util.promisify(require("child_process").exec)

const Koa = require("koa")
const app = new Koa()

const bodyParser = require("koa-bodyparser")
app.use(bodyParser({
  enableTypes: ["json"]
}))

const serve = require('koa-static')
app.use(serve("../frontend/public"))

let questions = []

function parseQuestions(text) {
	let combined = text.split('\n\n').slice(1)
	return combined.map(pair => {
		let split = pair.split("\n")
		let question = split[0].slice(5)
		let answer = split.slice(1).join("\n")
		return { question, answer }
	})
}

function loadNewQuestions(newquestions) {
  newquestions.forEach(nq => {
    if (!questions.some(q => q.answer == nq.answer)){
      nq.id = questions.reduce((max, q) => q.id > max ? q.id : max,-1)+1
      questions.push(nq)
    }
  })
  saveData()
}

function reloadQuestions() {
  return exec("./loadtextquestions.sh")
    .then(({stdout, stderr}) => {
      if (stderr) {
        return {
          status: "error",
          error: stderr
        }
      } else {
        loadNewQuestions(parseQuestions(stdout))
        return {
          status: "ok"
        }
      }
    })
}

loadData()

app.use(async ctx => {
    if (ctx.path == "/questions") {
      if (ctx.method == "GET") {
        ctx.body = questions
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else if (ctx.path == "/questions/reload") {
      ctx.body = await reloadQuestions()
    } else if (ctx.path == "/questions/random") {
      if (ctx.method == "GET") {
        ctx.body = questions[0]
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else if (ctx.path == "/questions/result") {
      if (ctx.method == "POST") {
        if ("id" in ctx.request.body && "correct" in ctx.request.body) {
          noteCorrect(ctx.request.body.id, ctx.request.body.correct)
        }
      } else {
        ctx.throw(405, "method not allowed")
      }
    } else {
      ctx.throw(404, "page not found")
    }
})

app.listen(8099)
console.log("cards backend listening on :8099")

function saveData() {
  fs.writeFile("questions.json", JSON.stringify(questions), function (err,data) {
    if (err) {
      return console.log(err);
    }
    if (data) {
      console.log(data)
    }
  })
  console.log("saved data")
}

function loadData() {
  try {
    questions = JSON.parse(fs.readFileSync("questions.json", 'utf8'))
  } catch (err) {
    console.error(err)
    questions = []
  }
}
