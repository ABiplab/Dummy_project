
const namespace = 'org.library'

/**
 * Initial Setup for demo data.
 *  @param {org.library.SetupDemo} setup
 *  @transaction
 */

async function setup(setup){
    const factory = getFactory()

 // create a sample reader Alice
 const readerRegistry = await getParticipantRegistry(`${namespace}.Reader`)
 const reader = factory.newResource(namespace,'Reader','alice')
 reader.name = 'Alice'
 reader.balance = 0

 await readerRegistry.add(reader)

 // create sample librarian bob
 const librarianRegistry = await getParticipantRegistry(`${namespace}.Librarian`)
 const librarian = factory.newResource(namespace,'Librarian','bob')
 librarian.name = 'Bob'
 await librarianRegistry.add(librarian)
 //create sample Books
 const bookRegistry = await getAssetRegistry(`${namespace}.Book`)
 const book1 = factory.newResource(namespace,'Book', 'hp')
 book1.title = 'Harry Poreter'
 book1.status = 'AVAILABLE'
 book1.originalPrice = 10000

 const book2 = factory.newResource(namespace,'Book','Hyperledger')
 book2.title = 'Hyperledger'
 book2.status = 'AVAILABLE'
 book2.originalPrice = 20000

await bookRegistry.addAll([book1, book2])

}

/** 
 * The borrow transaction
 * @param {org.library.Borrow} input
 * @transaction  
*/
async function borrow(input) {
    const { reader, book , timestamp } = input
    if (book.status === 'AVAILABLE' && reader.balance >=0 ){
        book.status='BORROWED'
        book.borrower = reader
        book.borrowedTime = timestamp

        const bookRegistry = await getAssetRegistry (`${namespace}.Book`)
        await bookRegistry.update(book)
    }
}

/** 
 * The return transaction
 * @param {org.library.Return} input
 * @transaction 
 * 
 * 
*/
async function returnTransaction(input) {
    const { book , timestamp } = input
    const { borrower,borrowedTime } = book
    if (book.status != 'BORROWED')
    {
        return
    }
    const readerRegistry = await getParticipantRegistry(`${namespace}.Reader`)
    const bookRegistry = await getAssetRegistry (`${namespace}.Book`)
    book.status = 'AVAILABLE'
    delete book.borrower
    delete book.borrowedTime
    await bookRegistry.update(book)

    const timeDiff = timestamp.getTime() - borrowedTime.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000*3600*24) )

    if (daysDiff >14) {
        //reader needs to pay fine
        const penalty = Math.min ( (daydiff - 14) *50 , book.originalPrice )
        borrower.balance -= penalty
        await readerRegistry.update(borrower)

    }
}

/** 
 * The lost transaction
 * @param {org.library.Lost} input
 * @transaction 
 * 
 * 
*/
async function lost(input) {
    const { book , timestamp } = input
    const { borrower,borrowedTime } = book
 
    const readerRegistry = await getParticipantRegistry(`${namespace}.Reader`)
    const bookRegistry = await getAssetRegistry (`${namespace}.Book`)
    book.status = 'LOST'
    delete book.borrower
    delete book.borrowedTime
    await bookRegistry.update(book)

    borrower.balance -= book.originalPrice
    await readerRegistry.update(borrower)
}