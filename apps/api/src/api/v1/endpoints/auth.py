from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from src.db.session import get_db
from src.core.security import get_password_hash, verify_password, create_access_token
from src.models.user import User, UserRole
from src.schemas.user import UserCreate, UserLogin, UserRead, UserUpdate, Token
from src.api.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Registers a new user account with hashed password and returns an access token."""
    # Check duplicate email or username
    stmt = select(User).where(
        or_(User.email == payload.email, User.username == payload.username)
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        if existing.email == payload.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )

    # Check if this is the very first user bootstrap
    count_stmt = select(func.count(User.id))
    total_users_res = await db.execute(count_stmt)
    total_users = total_users_res.scalar_one() or 0

    assigned_role = UserRole.ADMIN if total_users == 0 else UserRole.USER

    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role=assigned_role,
        is_superuser=(total_users == 0),
        preferences=payload.preferences or {},
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(subject=new_user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserRead.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
async def login_user(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Authenticates credentials (via email or username) and issues a JWT access token."""
    stmt = select(User).where(
        or_(
            User.email == payload.email_or_username,
            User.username == payload.email_or_username
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserRead.model_validate(user)
    )


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserRead:
    """Returns the profile information of the currently authenticated user."""
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_current_user_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Updates preferences or email for the currently authenticated user."""
    if payload.email and payload.email != current_user.email:
        # Check uniqueness
        stmt = select(User).where(User.email == payload.email)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use",
            )
        current_user.email = payload.email

    if payload.preferences is not None:
        merged = dict(current_user.preferences)
        merged.update(payload.preferences)
        current_user.preferences = merged

    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)
