import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Rent = () => {
    const [cars, setCars] = useState([]);
    const [selectedCar, setSelectedCar] = useState('');
    const [unavailableSlots, setUnavailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [userSlots, setUserSlots] = useState([]); // Track user-selected slots
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch available cars
        axios.get('http://127.0.0.1:8000/api/cars')
            .then(response => setCars(response.data))
            .catch(error => console.error('Error fetching cars', error));
    }, []);

    useEffect(() => {
        if (selectedCar) {
            // Fetch unavailable time slots for the selected car
            axios.get(`http://127.0.0.1:8000/api/unavailable-slots/${selectedCar}/${new Date().toISOString().split('T')[0]}`)
                .then(response => setUnavailableSlots(response.data))
                .catch(error => console.error('Error fetching unavailable slots', error));

            // Fetch user-selected slots for the selected car
            axios.get(`http://127.0.0.1:8000/api/user-selected-slots/${selectedCar}/${new Date().toISOString().split('T')[0]}`)
                .then(response => setUserSlots(response.data))
                .catch(error => console.error('Error fetching user-selected slots', error));
        }
    }, [selectedCar]);

    const handleCarChange = (e) => {
        setSelectedCar(e.target.value);
        setSelectedSlot(null); // Reset the selected slot when changing car
        setUserSlots([]); // Reset user slots when changing car
        setMessage('');
    };

    const handleClick = (hour) => {
        if (unavailableSlots.includes(hour) || userSlots.includes(hour)) return;

        setSelectedSlot(hour);
        setUserSlots([...userSlots, hour]); // Add the selected slot to userSlots
        setMessage(`You have selected the ${hour}:00 - ${hour + 1}:00 slot.`);
    };

    const handleSubmit = () => {
        if (!selectedCar) {
            setMessage('Please select a car.');
            return;
        }

        if (!selectedSlot) {
            setMessage('Please select a time slot before renting the car.');
            return;
        }

        axios.post('http://127.0.0.1:8000/api/rent-car', {
            make: selectedCar,
            start_time: selectedSlot,
            end_time: selectedSlot + 1,
        }).then(response => {
            setMessage('Car rental successful!');
            setUnavailableSlots([...unavailableSlots, ...userSlots]); // Add user slots to unavailable slots
            setUserSlots([]); // Clear user-selected slots after successful rental
        }).catch(error => {
            console.error('There was an error!', error);
            setMessage('There was an error creating the car rental.');
        });
    };

    return (
        <div>
            <h1>Rent a Car</h1>

            {/* Car Selection Dropdown */}
            <div>
                <label>Select a Car:</label>
                <select value={selectedCar} onChange={handleCarChange}>
                    <option value="" disabled>Select a car</option>
                    {cars.map(car => (
                        <option key={car.id} value={car.make}>{car.make}</option>
                    ))}
                </select>
            </div>

            {/* Time Slot Selection */}
            {selectedCar && (
                <div>
                    <h2>Select a Time Slot:</h2>
                    {Array.from({ length: 24 }, (_, hour) => (
                        <button
                            key={hour}
                            onClick={() => handleClick(hour)}
                            disabled={unavailableSlots.includes(hour) || new Date().getHours() >= hour}
                            style={{
                                margin: '5px',
                                padding: '10px',
                                backgroundColor: unavailableSlots.includes(hour) || userSlots.includes(hour) || new Date().getHours() >= hour ? 'gray' : 'blue'
                            }}
                        >
                            {hour}:00 - {hour + 1}:00
                        </button>
                    ))}
                </div>
            )}

            <p>{message}</p>

            {/* Submit Button */}
            {selectedCar && (
                <button onClick={handleSubmit}>Rent Car</button>
            )}
        </div>
    );
};

export default Rent;
