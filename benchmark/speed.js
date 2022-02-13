import Benchmark from 'benchmark'
import './info.js'
import UTP from '../index.js'

const suite = new Benchmark.Suite
UTP.addSchema('TEST_DATA', [
  { name: 'int', type: 'UINT8' },
  { name: 'name', type: 'STRING', optional: true },
  { name: 'text', type: 'STRING' }
])
UTP.addSchema('SPEED_TEST', [
  { name: 'id', type: 'UINT32' },
  { name: 'name', type: 'STRING' },
  { name: 'data', type: 'ARRAY', items: { type: 'SCHEMA', schema: 'TEST_DATA' } }
])

const DATA = {
  id: 1,
  name: 'name',
  data: [{
    int: 128,
    text: 'hello!'
  }, {
    int: 129,
    text: 'Hi!'
  }]
}
const ENCODED = UTP.encode('SPEED_TEST', DATA)

suite
  .add('encode', () => {
    UTP.encode('SPEED_TEST', DATA)
  })
  .add('decode', () => {
    UTP.decode(ENCODED)
  })
  .on('cycle', function (e) {
    console.log('' + e.target)
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run()