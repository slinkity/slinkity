const { argsArrayToPropsObj } = require('./addComponentShortcodes')
const { random, datatype } = require('faker')

describe('argsArrayToPropsObj', () => {
  it('should generate an empty object for empty arrays', () => {
    expect(argsArrayToPropsObj({ vargs: [] })).toEqual({})
  })
  it('should generate a props object for primitives', () => {
    const expected = {
      [random.word()]: datatype.number(),
      [random.word()]: random.word(),
    }
    const vargs = Object.entries(expected).flat()

    expect(argsArrayToPropsObj({ vargs })).toEqual(expected)
  })
  it('should generate a props object for nested objects', () => {
    const expected = {
      [random.word()]: {
        [random.word()]: datatype.number(),
        [random.word()]: [random.words(), random.words()],
      },
      [random.word()]: random.word(),
    }
    const vargs = Object.entries(expected).flat()

    expect(argsArrayToPropsObj({ vargs })).toEqual(expected)
  })
  it('should throw for invalid props array', () => {
    const vargs = ['all work', 'and no play', 'makes Jack']
    const errorMsg = 'Uh oh! We made a boo boo'

    expect(() => argsArrayToPropsObj({ vargs, errorMsg })).toThrow(new Error(errorMsg))
  })
  it('should return empty object when no params are passed', () => {
    expect(argsArrayToPropsObj({})).toEqual({})
  })
})
