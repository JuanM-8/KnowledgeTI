import '../styles/Cards.css'
export function Cards({categoria,problema}){
    return(
        <>
        <div className="card">
            <h3>{categoria}</h3>
            <h1>{problema}</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Qui harum odit iste dolore. Iusto, aliquam animi quos porro esse consequatur quidem ea quo officia aut cum reprehenderit provident sit! Amet!</p>
        </div>
        </>
    )
}