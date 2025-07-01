
function convertPokemonTypesToLi(pokemonTypes) {
    return pokemonTypes.map((typeSlot) => `<li class="type">${type.name}</li>`)
}

function convertPokemonToLi(pokemon) {

    const formattedNumber = pokemon.number.toString().padStart(3, '0');
    
    return `
    <li class="pokemon ${pokemon.type}">
        <span class="number">#${formattedNumber}</span>
        <span class="name">${pokemon.name}</span>

        <div class="details">   
            <ol class="types">
                ${pokemon.types.map((type) => `<li class="type ${type}" >${type}</li>`).join('')}
            </ol>

            <img src="${pokemon.photo}" 
                 alt="${pokemon.name}">
        </div>
    </li>
    `
}   

const pokemonList = document.getElementById('pokemonList')

pokeAPI.getPokemons().then((pokemons) => {
    pokemonList.innerHTML += pokemons.map(convertPokemonToLi).join('')
    
})