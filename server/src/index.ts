import 'dotenv/config'
import { app } from './app.js'
import { config } from './config.js'

app.listen(config.PORT, () => {
  console.log(`Factory Central API running on http://localhost:${config.PORT}`)
})
