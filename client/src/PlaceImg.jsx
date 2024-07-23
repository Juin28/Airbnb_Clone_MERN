export default function PlaceImg({ place, index=0, className=null }) {
    if (!place.photos?.length) {
        return "";
    }
    if (!className) {
        className = "object-cover rounded-2xl aspect-square";
    
    }
    return (
        <img src={`http://localhost:3000/uploads/${place.photos[index]}`} alt="place" className={className} />
    )
}