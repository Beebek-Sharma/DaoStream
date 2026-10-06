"""create_library_tables

Revision ID: ac223d7bd6ba
Revises: b3dd5465782e
Create Date: 2026-10-06 18:43:28.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac223d7bd6ba'
down_revision: Union[str, Sequence[str], None] = 'b3dd5465782e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Watchlists
    op.create_table(
        'watchlists',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('media_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_id'], ['media.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'media_id', name='uq_user_watchlist_media')
    )
    with op.batch_alter_table('watchlists', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_watchlists_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_watchlists_media_id'), ['media_id'], unique=False)

    # Favorites
    op.create_table(
        'favorites',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('media_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_id'], ['media.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'media_id', name='uq_user_favorite_media')
    )
    with op.batch_alter_table('favorites', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_favorites_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_favorites_media_id'), ['media_id'], unique=False)

    # Collections
    op.create_table(
        'collections',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('collections', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_collections_user_id'), ['user_id'], unique=False)

    # Collection Items
    op.create_table(
        'collection_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('collection_id', sa.String(length=36), nullable=False),
        sa.Column('media_id', sa.String(length=36), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_id'], ['media.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('collection_id', 'media_id', name='uq_collection_media_item')
    )
    with op.batch_alter_table('collection_items', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_collection_items_collection_id'), ['collection_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_collection_items_media_id'), ['media_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('collection_items', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_collection_items_media_id'))
        batch_op.drop_index(batch_op.f('ix_collection_items_collection_id'))
    op.drop_table('collection_items')

    with op.batch_alter_table('collections', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_collections_user_id'))
    op.drop_table('collections')

    with op.batch_alter_table('favorites', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_favorites_media_id'))
        batch_op.drop_index(batch_op.f('ix_favorites_user_id'))
    op.drop_table('favorites')

    with op.batch_alter_table('watchlists', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_watchlists_media_id'))
        batch_op.drop_index(batch_op.f('ix_watchlists_user_id'))
    op.drop_table('watchlists')
