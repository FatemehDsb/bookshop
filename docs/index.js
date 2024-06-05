
document.addEventListener("DOMContentLoaded", async () => {

const renderedBooksDiv = document.querySelector("#renderedBooksDiv");
const modalRegisterLogin = document.querySelector("#modalRegisterLogin");
let profilLinkDiv = document.getElementById("profileLinkDiv")
const headerElement =  document.querySelector(".header");
const profilePageHeaderElement = document.querySelector(".ProfilePageheader");

let readingListEntries=[];
let  ratedListEntries =[];
// let userData;

let toReadDiv=document.getElementById("toReadDiv");
let toReadListLink = document.getElementById("toReadListLink");
let ratedListLink = document.getElementById("ratedLink");

//check to see in which page we are now - 
const checkCurrentPage = () => {
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "profilePage.html") {
        document.querySelector("#loginLink").style.display = "none";
    }
};
checkCurrentPage();
//Update header based on inloggeduser 
const updateHeader = async () => {
    let isLoggedIn = await checkIfLoggedIn();
    let user = JSON.parse(sessionStorage.getItem("user"));
 if (isLoggedIn && user) {
    profilLinkDiv.style.display="block";
        if (headerElement) {
            headerElement.innerHTML = `<h2>Welcome ${user.username}</h2>`;
        }
        if (profilePageHeaderElement) {
            profilePageHeaderElement.innerHTML = `<h2>Welcome ${user.username}</h2>`;
        }
        loginLink.style.display = "none";
    } else {
        if (headerElement) {
            headerElement.innerHTML = "";
        }
        if (profilePageHeaderElement) {
            profilePageHeaderElement.innerHTML = "";
        }
    }
};

let getData = async(url)=>{
    let response = await axios.get(url);
    return response.data;
}

let loadPage = async()=>{
    try{
        let response = await getData("http://localhost:1337/api/books?populate=deep,4");
        booksData = response.data;
        renderBooks(booksData);
        updateHeader();
        
        
    }catch(e){
        console.error("Error loading page:", error);
    }
    }
loadPage();


let openModal = ()=>{

    console.log("Trying to open modal...");
    console.log("modalRegisterLogin:", modalRegisterLogin);
    
    if ( modalRegisterLogin ){
        console.log("modal finns");
        modalRegisterLogin.style.display = "flex"
    }else{
        console.log("modal is not exist");
    }
    };
document.querySelector("#loginLink")?.addEventListener("click", openModal)
//clos modal
//click on page

let closeModal = document.getElementById("closeModal");
closeModal?.addEventListener("click",() =>{
    modalRegisterLogin.style.display="none"
})


let register = async ()=>{
    try{
        let response = await axios.post("http://localhost:1337/api/auth/local/register",
        {
            username:document.querySelector("#registerUsername").value,
            email: document.querySelector("#registerEmail").value,
            password : document.querySelector("#registerPassword").value,
        }
        );
        alert("You are registered!")
    }catch(error){
        console.log("registeration error");
    }
};
let login =async()=>{
    try{
        let response = await axios.post("http://localhost:1337/api/auth/local/",
        {
            identifier : document.querySelector("#loginUser").value,
            password : document.querySelector("#loginPassword").value,
        });
        console.log("logged in successfully!");
        console.log(response);

        sessionStorage.setItem("token", response.data.jwt);
        sessionStorage.setItem("user", JSON.stringify(response.data.user))
        if ( modalRegisterLogin ){
            modalRegisterLogin.style.display = "none"
        }else{
            console.log("modal is not exist");
        }
        loadPage();
        profilLinkDiv.style.display="block"
        // loadUserPage();
    }catch(error){
        console.log("login error");
    }
}
let logout = async ()=>{
try{
    sessionStorage.clear();
    renderBooks();
    loadPage();
    updateHeader();
    document.getElementById("loginLink").style.display="block";
    profilLinkDiv.style.display="none";
    window.location.replace("index.html");
    console.log(("loged out successfully!"));
}catch(error){
    console.log("log out error");
}
}
let renderBooks = async(booksData)=>{
    let isLoggedIn = await checkIfLoggedIn();
    if (renderedBooksDiv) {
        renderedBooksDiv.innerHTML = ''; 
    }
    booksData?.forEach(book => {
    if (!book.attributes.avgRating) {
        book.attributes.avgRating = 0;
    }
    if(renderedBooksDiv){
        let bookHtml =
                `<div id="book-cart-${book.id}" class="book-cart" >
                    <img  src="http://localhost:1337${book.attributes.Cover?.data?.attributes.url}">
                    <p>${book.attributes.Title}</p>
                    <p>${book.attributes.Author}</p>
                    <p>${book.attributes.Pages}</p>
                    <p>${book.attributes.Publication}</p>
                    <p>Average rating: ${book?.attributes?.avgRating}</p>`
            if(isLoggedIn){
            bookHtml +=
                    `<label for=${book.id}>Check To Add To Reading List</label>
                    <input type ="checkbox" id =${book.id}>
                    <div class="stars" data-book-id="${book.id}">
                    ${renderStars(book.id)}
                    </div>
                </div>`
                }
                renderedBooksDiv.innerHTML += bookHtml;
            }
        });
    // if (renderedBooksDiv){
    //     renderedBooksDiv.style.border="1px solid green"
    // }     
if (isLoggedIn) {
    document.querySelectorAll('.star')?.forEach(star => {
        star?.addEventListener('click', async (e) => {
            const bookId = JSON.parse(e.target.getAttribute('data-book-id'));
            const rating = JSON.parse(e.target.getAttribute('data-rating'));
            await submitRating(bookId, rating);
            await highlightStars(bookId, rating);
        });
    });
}


let checkboxes = document.querySelectorAll("input[type='checkbox']");
checkboxes.forEach(checkbox=>{
    checkbox.addEventListener("change", async ()=>{
        let isLoggedIn = await checkIfLoggedIn();

    if (isLoggedIn){
            console.log("you are logged in");
            let  bookId=Number(checkbox.id);
            addingtoReadingList(bookId);

    }else{
            console.log("not logged in");
            }
    })
});
}




let checkIfLoggedIn= async()=>{
    
    try{
       const response= await axios.get("http://localhost:1337/api/users/me",
            {
                headers:{
                Authorization : `Bearer ${sessionStorage.getItem("token")}`,
                },
            });
            return !!response.data
    }catch{
        return false;
    }
};

const fetchReadingList = async ()=>{
    try{
        const loggedInUser = await axios.get("http://localhost:1337/api/users/me?populate=deep,4", {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            }
        });
        return loggedInUser.data.reading_list_entries;;
    }catch(error){
    console.error("You are not logged in ", error);
    }
}
const renderReadinglist = async () => {
    const readingList = document.getElementById("readingList");
    if(readingList){
    readingList.innerHTML = "";
    }
    readingListEntries = await fetchReadingList();
    readingListEntries?.forEach(entry => {
        if(readingList){
            readingList.innerHTML += `
            <div id="reading-list-entry-${entry.id}">
            <img height="150px" src="http://localhost:1337${entry.book?.Cover?.url}">
            <p>${entry.book?.Title}</p>
            <p>${entry.book?.Author}</p>
            <p>${entry.book?.Pages}</p>
            <p>${entry.book?.Publication}</p>
            <p>Average rating: ${entry.book?.avgRating}</p>
            <button id="deleteReadingEntriesBtn${entry.id}">Delete</button>
            </div>`;
        }
    });
    
    readingListEntries?.forEach(entry => {
        document.querySelector(`#deleteReadingEntriesBtn${entry.id}`)?.addEventListener("click", () => deleteReadingEntry(entry.id));
    });
};
let addingtoReadingList = async(bookId)=>{
    let user = JSON.parse(sessionStorage.getItem("user"));
        let userId = user.id;
        readingListEntries= await fetchReadingList();
        let bookExists =  readingListEntries?.some(entry => entry.book.id === bookId);
    if (bookExists) {
        alert("This book is already in the reading list.");
        return;
        }
try{
        let response = await axios.post(`http://localhost:1337/api/reading-list-entries?populate=deep,4`,
        {
            data: {
                user:userId,
                book:bookId
                } ,
            },
            {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                }
            }
        );
        console.log(response);
        await renderReadinglist();

}catch(e){
    console.error("Error adding book to reading list:");
}
}
redirectToProfilePage= async()=>{
    window.location.replace("profilePage.html");
}


toReadListLink?.addEventListener("click", async()=>{
    toReadDiv.style.display="block";
    ratedDiv.style.display="none";
    // await fetchReadingList();
    await renderReadinglist();
   
})


let deleteReadingEntry = async(entryId)=>{
    try{
        let response = await axios.delete(`http://localhost:1337/api/reading-list-entries/${entryId}`)
        console.log("Successfull Axios delete", response.data);

        const entryElement = document.querySelector(`#reading-list-entry-${entryId}`);
        if (entryElement) {
            entryElement.remove();
            console.log(" UI Successfull deleting");
        }else{
            console.log("UI unsuccessfull deleting");
        }


    }catch(error){
        console.log("unsuccessfull Axios delete");
    }
}

document.querySelector("#registerBtn")?.addEventListener("click", register);
document.querySelector("#loginBtn")?.addEventListener("click", login);
document.querySelector("#logoutLink")?.addEventListener("click", logout);
profilLinkDiv?.addEventListener("click", redirectToProfilePage)

let fetchThemeSetting = async ()=>{
    try{
        let response = await axios.get(`http://localhost:1337/api/theme-setting`,
            {
                headers:{
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                }
            }
        )
        console.log(response.data.data);
       if(response && response.data){
        let theme = response.data.data?.attributes.selectedTheme;
        console.log('Selected Theme:',theme);

        if(theme){
            document.documentElement.className ='';
            document.documentElement.classList.add(theme);
        }
       }
    }catch(e){
        console.log('Error fetching data:', e);
    }
}
fetchThemeSetting();

const sortSelect = document.getElementById('sortCriteria');
sortSelect?.addEventListener("change", async ()=>{
   await fetchReadingList();
   console.log(readingListEntries);
    sortValue = sortSelect.value;
    try{
        console.log("Before sorting:", readingListEntries.map(entry => entry.book.Title));
        if(sortValue === "title"){
            readingListEntries.sort((a,b)=>a.book.Title.localeCompare(b.book.Title));
            console.log("sorting based on", sortValue);

        }else if ( sortValue === "author"){
            readingListEntries.sort((a,b)=>a.book.Author.localeCompare(b.book.Author));
            console.log("sorting based on", sortValue);
        }
        console.log("After sorting:", readingListEntries.map(entry => entry.book.Title));

        renderReadinglist(readingListEntries);
        console.log("successfull sorting");
    }catch(e){
        console.log("error" , e);
    }
});





//Rating 


const renderStars = (bookId) => {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="star" data-book-id="${bookId}" data-rating="${i}">&#9733;</span>`;
    }
    return starsHtml;
};

const highlightStars = async (bookId, rating) => {
    const stars = document.querySelectorAll(`#book-cart-${bookId} .star`);
    try{
    stars.forEach(star => {
        const starRating = star.getAttribute('data-rating');
        if (starRating <= rating) {
            star.classList.add('checked');
        } else {
            star.classList.remove('checked');
        }
    });
    }catch(e){
    console.log("error to highligh starts", e);
    }
};

ratedListLink?.addEventListener("click",async()=>{
    toReadDiv.style.display="none";
    ratedDiv.style.display="block";
    // ratedDiv.style.display.flex.wrap="wrap"
    await renderRatedList();
} )


let fetchRatingList = async ()=>{
       //fetch all ratings for one user
    const loggedInUserData = await axios.get("http://localhost:1337/api/users/me?populate=deep,4", {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        }
    });

    // console.log(loggedInUserData.data.ratings);
    return loggedInUserData.data.ratings;
}


let renderRatedList = async ()=>{
    let ratedList = document.getElementById("ratedList");
    if(ratedList){
        ratedList.innerHTML = "";
        }
      ratedListEntries = await fetchRatingList();
console.log(`ratedlistentries : ${ratedListEntries}`);
   

ratedListEntries?.forEach(entry=>{
        if( ratedList){
            ratedList.innerHTML+=
            `<div id="book-cart-${entry?.book?.id}">
            <img  height="150px"src="http://localhost:1337${entry?.book?.Cover?.url}">
            <p>${entry?.book?.Title}</p>
            <p>${entry?.book?.Author}</p>
            <p>${entry?.book?.Pages}</p>
            <p>${entry?.book?.Publication}</p>
            <p>Your Rating: ${entry?.rating}</p>
            <p>Average Rating: ${entry.book?.avgRating}</p>`
        }
    })
}

const submitRating = async (bookId, rating) => {
   
    try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        const userId = user.id;
    
        ratedListEntries = await fetchRatingList();
        // console.log(ratedListEntries);

        let ratingForThisBook = ratedListEntries?.find(entry => entry?.book?.id === bookId && entry?.user?.id === userId);
            
        if(ratingForThisBook){
            //update rating 
            await axios.put(`http://localhost:1337/api/ratings/${ratingForThisBook.id}`, {
                data: {
                    rating: rating
                }
            }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                }
            })
        }else{ //post new entry
         let response= await axios.post(`http://localhost:1337/api/ratings?populate=deep,5`, {
            data: {
                user: userId,
                book: bookId,
                rating: rating
            }
        }, {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            }
        });
        }
        //i need to get all ratings for all users 
        let responseRatings= await axios.get(`http://localhost:1337/api/ratings?populate=deep,5`, {
            
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                }

        })
        let allRatingsEntries = responseRatings?.data?.data;
         console.log(responseRatings.data.data);
        ratingsForOneBook = allRatingsEntries?.filter(entry => entry?.attributes?.book?.data?.id === bookId);
        console.log(ratingsForOneBook);

        if (ratingsForOneBook.length === 0) {
            console.error('No ratings found for this book.');
            return;
        }
        const totalRatings = ratingsForOneBook.length;
        console.log(totalRatings);
        const sumRatings = ratingsForOneBook?.reduce((sum, entry) => {
            const rating = entry?.attributes?.rating;
            return sum + rating;
        }, 0);

        const newAverageRating = Math.round(sumRatings / totalRatings);

        await axios.put(`http://localhost:1337/api/books/${bookId}`, {
            data: {
                avgRating: newAverageRating
            }
        }, {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            }
        });
        
        let response = await axios.get(`http://localhost:1337/api/books?populate=deep,6`, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                }
        })
        let updatedBooksData = response?.data?.data

        //update rating number in home page and userpage       
        await renderBooks(updatedBooksData);
    }
    catch (error) {
        console.error("Error submitting rating:", error);
    }
};

    


// sorting for rated books 

const ratingSortSelect = document.getElementById('ratingSortCriteria');
ratingSortSelect?.addEventListener("change", async ()=>{
   let allRatedBooks = await fetchRatingList();
   console.log(allRatedBooks);
    let sortValue = ratingSortSelect.value;
    try{
        console.log("Before sorting:", allRatedBooks.map(entry => entry?.book?.Title));
        if(sortValue === "title"){
            allRatedBooks.sort((a,b)=>a?.book?.Title.localeCompare(b?.book?.Title));
            console.log("sorting based on", sortValue);

        }else if ( sortValue === "author"){
            allRatedBooks.sort((a,b)=>a?.book?.Author.localeCompare(b?.book?.Author));
            console.log("sorting based on", sortValue);
        }else if (sortValue ==="rating"){
            allRatedBooks.sort((a, b)=>b.rating-a.rating)

        }
        console.log("After sorting:", allRatedBooks.map(entry => entry?.book?.Title));

        ratedList.innerHTML = "";
        
        allRatedBooks?.forEach(entry=>{
            if( ratedList){
                ratedList.innerHTML+=
                `<div id="book-cart-${entry?.book?.id}">
                <img  height="150px"src="http://localhost:1337${entry?.book?.Cover?.url}">
                <p>${entry?.book?.Title}</p>
                <p>${entry?.book?.Author}</p>
                <p>${entry?.book?.Pages}</p>
                <p>${entry?.book?.Publication}</p>
                <p>Your Rating: ${entry?.rating}</p>
                <p>Average Rating: ${entry?.book?.avgRating}</p>`
            }
        })
  

        console.log("successfull sorting");
    }catch(e){
        console.log("error" , e);
    }
});


//sorting reading list 
const readingSortSelect = document.getElementById(`readingSortCriteria`);
readingSortSelect?.addEventListener("change", async()=>{
    let allToReadBooks = await fetchReadingList();
    console.log(allToReadBooks);
    let sortValue = readingSortSelect.value;
    try{
        if(sortValue === "title"){
            allToReadBooks.sort((a,b)=>a?.book?.Title.localeCompare(b?.book?.Title));
            console.log("sorting based on", sortValue);

        }else if ( sortValue === "author"){
            allToReadBooks.sort((a,b)=>a?.book?.Author.localeCompare(b?.book?.Author));
            console.log("sorting based on", sortValue);
        }
        readingList.innerHTML = "";
        
        allToReadBooks?.forEach(entry=>{
            if( readingList){
                readingList.innerHTML+=
                `<div id="book-cart-${entry?.book?.id}">
                <img  height="150px"src="http://localhost:1337${entry?.book?.Cover?.url}">
                <p>${entry?.book?.Title}</p>
                <p>${entry?.book?.Author}</p>
                <p>${entry?.book?.Pages}</p>
                <p>${entry?.book?.Publication}</p>
                <p>Your Rating: ${entry?.rating}</p>
                <p>Average Rating: ${entry?.book?.avgRating}</p>`
            }
        })
  

        console.log("successfull sorting");

    }catch(e){
        console.log(e);
    }

})


});