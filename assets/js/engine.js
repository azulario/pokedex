
const pokemonList = document.getElementById('pokemonList')
const loadMoreButton = document.getElementById('loadMoreButton')
const limit = 10;
let offset = 0;
const maxRecords = 151;

 

function loadPokemonItems(offset, limit) {
    
    pokeAPI.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map((pokemon) => {
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
        }).join('')

        pokemonList.innerHTML += newHtml

    })
}

loadPokemonItems(offset, limit)

loadMoreButton.addEventListener('click', () => {
    offset += limit;

    const recordNextPage = offset + limit;

    if (recordNextPage >= maxRecords) {
        const newLimit = maxRecords - offset;
        loadPokemonItems(offset, newLimit);

        loadMoreButton.parentElement.removeChild(loadMoreButton);

    } else {
        loadPokemonItems(offset, limit);
    }

});