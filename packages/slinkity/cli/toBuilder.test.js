const { toBuilder } = require('./toBuilder')

describe('toBuilder', () => {
  it('returns build result successfully', async () => {
    const builder = toBuilder((id) => new Promise((resolve) => resolve(`built ${id}`)))
    const buildResult = await builder.build('blog')
    expect(buildResult).toEqual('built blog')
  })
  it('returns multiple built results successfully', async () => {
    const builder = toBuilder((id) => new Promise((resolve) => resolve(`built ${id}`)))
    const [blogResult, homeResult, contactResult] = await Promise.all([
      builder.build('blog'),
      builder.build('home'),
      builder.build('contact'),
    ])
    expect(blogResult).toEqual('built blog')
    expect(homeResult).toEqual('built home')
    expect(contactResult).toEqual('built contact')
  })
  it('does not rerun build for same id', async () => {
    const buildCallback = jest.fn()
    buildCallback.mockImplementation(
      (id) =>
        new Promise((resolve) => {
          setTimeout(() => resolve(`built ${id}`), 50)
        }),
    )
    const id = 'product-page'
    const builder = toBuilder(buildCallback)
    const results = await Promise.all([id, id, id, id, id, id].map((id) => builder.build(id)))
    expect(buildCallback).toHaveBeenCalledTimes(1)
    for (const result of results) {
      expect(result).toEqual(`built ${id}`)
    }
  })
  it('does not rerun build for cached values', async () => {
    const buildCallback = jest.fn()
    buildCallback.mockImplementation((id) => new Promise((resolve) => resolve(`built ${id}`), 10))
    const id = 'cached-page'
    const builder = toBuilder(buildCallback)
    await builder.build(id)
    expect(buildCallback).toHaveBeenCalledTimes(1)
    buildCallback.mockClear()
    await builder.build(id)
    expect(buildCallback).toHaveBeenCalledTimes(0)
  })
})
