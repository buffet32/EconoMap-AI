import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDash.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAddressCard, faCheck, faTrash, faChevronUp, faChevronDown, faPen,faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const AdashM = () => {
    const [users, setUsers] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState({});
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser).user;
                if (user.role !== 'admin') {
                    navigate('/');
                } else {
                    setLoggedIn(true);
                }
            } catch {
                navigate('/');
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, [search, page]);

    const fetchUsers = () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsed = JSON.parse(storedUser);
        const token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
        if (!token) return;
        axios.get(`http://127.0.0.1:8000/api/users/?search=${search}&page=${page}`,
            { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                console.log('API users response:', response.data);
                setUsers(Array.isArray(response.data) ? response.data : (response.data.results || []));
                setTotalEntries(Array.isArray(response.data) ? response.data.length : (response.data.count || 0));
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    };

    const updateUserStatus = (id, is_active) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsed = JSON.parse(storedUser);
        const token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
        if (!token) return;
        axios.patch(`http://127.0.0.1:8000/api/users/${id}/`, { is_active: !is_active },
            { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === id ? { ...user, is_active: !is_active } : user
                    )
                );
            })
            .catch(error => {
                console.error('Error updating user status:', error);
            });
    };

    const deleteUser = (id) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const parsed = JSON.parse(storedUser);
        const token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
        if (!token) return;
        axios.delete(`http://127.0.0.1:8000/api/users/${id}/`,
            { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
            })
            .catch(error => {
                console.error('Error deleting user:', error);
            });
    };

    const handleCollapseToggle = (id) => {
        setIsCollapsed(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && (newPage - 1) * perPage < totalEntries) {
            setPage(newPage);
        }
    };

    const lastPage = Math.ceil(totalEntries / perPage);

    return (
        <div className="container mt-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 id='bnr'>Utilisateurs</h1>
                <button
                    style={{ 
                        background: 'linear-gradient(135deg, #8c54bc, #4fd1c5)', 
                        color: '#fff', 
                        border: 'none',
                        borderRadius: '12px', 
                        padding: '12px 24px', 
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => navigate('/admin-dashboard')}
                >
                    📊 Tableau de Bord
                </button>
            </div>
            <div className="input-group mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <form className="form-inline" style={{ flex: 1 }}>
                    <label>Recherche<FontAwesomeIcon className='mx-2' icon={faMagnifyingGlass} /></label>
                    <input dir='ltr' type="text" id="form1" className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} />
                </form>
                <button
                    style={{ background: '#fbbf24', color: '#23233a', marginLeft: 16, borderRadius: 8, padding: '8px 18px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    onClick={() => navigate('/ajouter-utilisateur')}
                >
                    <FontAwesomeIcon icon={faAddressCard} style={{ marginRight: 8 }} />
                    Ajouter utilisateur
                </button>
            </div>
            {Array.isArray(users) && users.map(user => (
                <table key={user.id} id='Ctable' className="table table-borderless bg-black">
                    <tbody>
                        <tr>
                            <td onClick={() => handleCollapseToggle(user.id)} data-toggle="collapse" data-target={`#user${user.id}`} className="toggle">
                                <div className="d-flex text-white mt-3">
                                    <FontAwesomeIcon
                                        icon={isCollapsed[user.id] ? faChevronUp : faChevronDown}
                                        className="mx-2"
                                    />
                                    <div><FontAwesomeIcon className="mx-2" icon={faAddressCard} /></div>
                                    <p className="mb-0">{user.username}</p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="6" className="hiddenRow">
                                <div id={`user${user.id}`} className="accordian-body collapse">
                                    <div className="p-3">
                                        <p className='text-white'>Numéro de carte: {user.numero_carte}</p>
                                        <p className='text-white'>Téléphone: {user.numero_telephone || 'N/A'}</p>
                                        <p className='text-white'>Role: {user.role}</p>
                                        <p className='text-white'>Status: <span className={`status ${user.is_active ? 'text-success' : 'text-danger'}`}>&bull;</span> {user.is_active ? 'Actif' : 'Inactif'}</p>
                                        <button className="btn btn-danger btn-sm mr-2" onClick={() => deleteUser(user.id)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                        <button className="btn btn-info btn-sm mx-2" onClick={() => navigate(`/modifier-utilisateur/${user.id}`)}>
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                        <button className="btn btn-success btn-sm mx-2" onClick={() => updateUserStatus(user.id, user.is_active)}>
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            ))}

            {/* Pagination */}
            <div className="clearfix">
    <div className="hint-text">Affichage de <b id='g-font'>{(page - 1) * perPage + 1}</b> à <b id='g-font'>{Math.min(page * perPage, totalEntries)}</b> sur <b id='g-font'>{totalEntries}</b> utilisateurs</div>
    <ul id='pagination' className="pagination">
        <li className="page-item">
            <button id='a-font' className="page-link mx-1" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Précédent</button>
        </li>
        {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
            <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                <button className="page-link mx-1" onClick={() => handlePageChange(p)}>{p}</button>
            </li>
        ))}
        <li className="page-item">
            <button id='a-font' className="page-link mx-1" onClick={() => handlePageChange(page + 1)} disabled={page === lastPage}>Suivant</button>
        </li>
    </ul>
</div>


        </div>
    );
};

export default AdashM;
